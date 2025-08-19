from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def product_count(self):
        return self.products.count()


class Product(models.Model):
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    threshold = models.PositiveIntegerField(default=10, help_text="Minimum stock level")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('18.00'), help_text="GST rate in percentage")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_products')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.threshold

    @property
    def is_out_of_stock(self):
        return self.stock_quantity == 0

    @property
    def price_with_gst(self):
        """Calculate price including GST"""
        if self.price and self.gst_rate is not None:
            # Convert to Decimal to avoid type mismatch
            return self.price * (1 + self.gst_rate / Decimal('100'))
        return self.price

    @property
    def gst_amount(self):
        """Calculate GST amount only"""
        if self.price and self.gst_rate is not None:
            return self.price * (self.gst_rate / Decimal('100'))
        return Decimal('0.00')

    @property
    def total_value(self):
        """Calculate total inventory value for this product"""
        return self.price * Decimal(str(self.stock_quantity))

    def save(self, *args, **kwargs):
        # Auto-generate SKU if not provided
        if not self.sku:
            # Get the last product ID and generate SKU
            last_product = Product.objects.all().order_by('id').last()
            if last_product:
                next_id = last_product.id + 1
            else:
                next_id = 1
            self.sku = f"PRD-{next_id:04d}"
        
        super().save(*args, **kwargs)