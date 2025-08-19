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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

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

    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='invoices')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
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

    def save(self, *args, **kwargs):
        # Generate invoice number if not provided
        if not self.invoice_number:
            year = timezone.now().year
            last_invoice = Invoice.objects.filter(
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
            # Validate stock
            products_to_update = []
            for item in self.items.select_related('product'):
                product = item.product
                if product.stock_quantity < item.quantity:
                    raise ValueError(f"Insufficient stock for {product.name} (needed {item.quantity}, available {product.stock_quantity})")
                products_to_update.append((product, item.quantity))

            # Apply deductions
            for product, qty in products_to_update:
                product.stock_quantity = product.stock_quantity - qty
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