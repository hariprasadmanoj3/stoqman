from django.contrib import admin
from .models import Customer, Invoice, InvoiceItem, Payment

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'created_at']
    search_fields = ['name', 'email', 'phone']

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'total', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['invoice_number', 'customer__name']
    inlines = [InvoiceItemInline]
    readonly_fields = ['invoice_number', 'created_at', 'updated_at']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'amount', 'payment_method', 'created_at']
    list_filter = ['payment_method', 'created_at']