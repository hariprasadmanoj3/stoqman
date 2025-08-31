from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.db import transaction
import uuid

User = get_user_model()

class Customer(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=100, default='India')
    gstin = models.CharField(max_length=15, blank=True, help_text="GST Identification Number")
    shop = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shop_customers', limit_choices_to={'role__in': ['shop_owner', 'admin']}, default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'shop']  # Same name can exist in different shops

    def __str__(self):
        return f"{self.name} ({self.shop.shop_name})"

    @property
    def full_address(self):
        address_parts = [self.address, self.city, self.state, self.postal_code, self.country]
        return ', '.join([part for part in address_parts if part])


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('due', 'Due'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    invoice_number = models.CharField(max_length=50, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    shop = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shop_invoices', limit_choices_to={'role__in': ['shop_owner', 'admin']}, default=1)
    
    # Dates
    invoice_date = models.DateField(default=timezone.now)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Notes
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    
    # Meta
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_invoices')
    # Track whether stock adjustments have been applied for this invoice
    stock_applied = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['invoice_number', 'shop']  # Same invoice number can exist in different shops

    def save(self, *args, **kwargs):
        # Generate invoice number if not provided
        if not self.invoice_number:
            year = timezone.now().year
            last_invoice = Invoice.objects.filter(
                shop=self.shop,
                invoice_number__startswith=f'INV-{year}-'
            ).order_by('-invoice_number').first()
            
            if last_invoice:
                try:
                    last_num = int(last_invoice.invoice_number.split('-')[-1])
                    new_num = last_num + 1
                except (ValueError, IndexError):
                    new_num = 1
            else:
                new_num = 1
            
            self.invoice_number = f"INV-{year}-{new_num:04d}"
        
        # Set due date if not provided (30 days from invoice date)
        if not self.due_date:
            from datetime import timedelta
            self.due_date = self.invoice_date + timedelta(days=30)
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name}"

    @property
    def is_overdue(self):
        if self.status in ['due', 'partial'] and self.due_date < timezone.now().date():
            return True
        return False

    @property
    def remaining_amount(self):
        return self.total_amount - self.paid_amount

    def calculate_totals(self):
        """Calculate invoice totals from items"""
        items = self.items.all()
        
        self.subtotal = sum(item.line_total for item in items)
        self.tax_amount = sum(item.tax_amount for item in items)
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        
        # Use update to avoid recursion
        Invoice.objects.filter(id=self.id).update(
            subtotal=self.subtotal,
            tax_amount=self.tax_amount,
            total_amount=self.total_amount
        )

    def apply_stock_adjustments(self):
        """Apply stock deductions for all items atomically.
        Raises ValueError if stock is insufficient or stock already applied.
        """
        if self.stock_applied:
            raise ValueError("Stock already applied for this invoice")

        # Fetch related items and lock products rows for update to avoid races
        from inventory.models import Product
        with transaction.atomic():
            # Gather product ids from items
            invoice_items = list(self.items.select_related('product'))
            product_id_to_required_qty = {}
            for item in invoice_items:
                if not item.product_id:
                    # Skip manual line items without a product
                    continue
                product_id_to_required_qty[item.product_id] = (
                    product_id_to_required_qty.get(item.product_id, 0) + int(item.quantity)
                )

            # Lock all involved product rows
            locked_products = (
                Product.objects.select_for_update()
                .filter(id__in=list(product_id_to_required_qty.keys()))
            )
            products_by_id = {p.id: p for p in locked_products}

            # Validate stock
            for product_id, required_qty in product_id_to_required_qty.items():
                product = products_by_id.get(product_id)
                if product is None:
                    raise ValueError("Product not found while applying stock")
                if int(product.stock_quantity) < int(required_qty):
                    raise ValueError(
                        f"Insufficient stock for {product.name} (needed {required_qty}, available {product.stock_quantity})"
                    )

            # Apply deductions
            for product_id, required_qty in product_id_to_required_qty.items():
                product = products_by_id[product_id]
                product.stock_quantity = int(product.stock_quantity) - int(required_qty)
                product.save(update_fields=['stock_quantity'])

            # Mark applied and move status if still draft
            self.stock_applied = True
            if self.status == 'draft':
                self.status = 'due'
            self.save(update_fields=['stock_applied', 'status', 'updated_at'])


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('inventory.Product', on_delete=models.CASCADE, null=True, blank=True)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'))
    
    class Meta:
        unique_together = ['invoice', 'product']

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.product.name}"

    @property
    def line_total(self):
        """Calculate line total without tax"""
        return self.quantity * self.unit_price

    @property
    def tax_amount(self):
        """Calculate tax amount for this line"""
        return self.line_total * (self.tax_rate / Decimal('100'))

    @property
    def total_with_tax(self):
        """Calculate total including tax"""
        return self.line_total + self.tax_amount

    def save(self, *args, **kwargs):
        # Set unit price from product if not provided
        if not self.unit_price and self.product:
            self.unit_price = self.product.price
        
        # Set tax rate from product if not provided
        if not self.tax_rate and self.product and hasattr(self.product, 'gst_rate'):
            self.tax_rate = self.product.gst_rate
        
        super().save(*args, **kwargs)
        
        # Recalculate invoice totals
        if self.invoice_id:
            self.invoice.calculate_totals()

    def delete(self, *args, **kwargs):
        invoice = self.invoice
        # Prevent deleting items if invoice is finalized
        if invoice.stock_applied:
            raise ValueError("Cannot modify items of a finalized invoice")
        super().delete(*args, **kwargs)
        # Recalculate totals after deletion
        invoice.calculate_totals()


class Payment(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('credit_card', 'Credit Card'),
        ('check', 'Check'),
        ('upi', 'UPI'),
    ]
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment {self.amount} for {self.invoice.invoice_number}"

    def save(self, *args, **kwargs):
        # When saving a payment, update the invoice paid_amount and status with rounding and clamping
        creating = self._state.adding
        super().save(*args, **kwargs)
        if creating:
            from decimal import ROUND_HALF_UP
            invoice = self.invoice
            invoice.paid_amount = (Decimal(invoice.paid_amount) + Decimal(self.amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            if invoice.paid_amount >= invoice.total_amount:
                invoice.paid_amount = invoice.total_amount
                invoice.status = 'paid'
                invoice.paid_date = timezone.now().date()
            elif invoice.paid_amount > Decimal('0.00'):
                invoice.status = 'partial'
            invoice.save(update_fields=['paid_amount', 'status', 'paid_date', 'updated_at'])