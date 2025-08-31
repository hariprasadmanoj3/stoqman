from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class User(AbstractUser):
    ROLE_CHOICES = (
        ('shop_owner', 'Shop Owner'),
        ('admin', 'Admin'),
        ('staff', 'Staff'),
    )
    
    # Basic user fields
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default='staff')
    phone = models.CharField(
        max_length=15, 
        blank=True, 
        null=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ]
    )
    
    # Business/Shop information (for shop owners)
    shop_name = models.CharField(max_length=100, blank=True, null=True)
    business_type = models.CharField(max_length=50, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    country = models.CharField(max_length=50, blank=True, null=True)
    postal_code = models.CharField(max_length=10, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Email verification
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    
    # Account status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        if self.shop_name:
            return f"{self.shop_name} - {self.username} ({self.role})"
        return f"{self.username} ({self.role})"
    
    @property
    def is_shop_owner(self):
        return self.role == 'shop_owner'
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username