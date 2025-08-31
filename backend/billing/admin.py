from django.contrib import admin
from .models import Customer, Invoice, InvoiceItem

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'city', 'gstin', 'created_at']
    search_fields = ['name', 'email', 'phone', 'gstin']
    list_filter = ['city', 'state', 'country', 'created_at']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    fields = ['product', 'description', 'quantity', 'unit_price', 'tax_rate']
    readonly_fields = ['line_total', 'tax_amount', 'total_with_tax']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = [
        'invoice_number', 'customer', 'status', 'invoice_date', 
        'due_date', 'total_amount', 'paid_amount', 'is_overdue'
    ]
    list_filter = ['status', 'invoice_date', 'due_date', 'created_at']
    search_fields = ['invoice_number', 'customer__name', 'customer__email']
    ordering = ['-created_at']
    readonly_fields = [
        'invoice_number', 'subtotal', 'tax_amount', 'total_amount',
        'remaining_amount', 'is_overdue', 'created_at', 'updated_at'
    ]
    inlines = [InvoiceItemInline]
    
    fieldsets = (
        ('Invoice Details', {
            'fields': ('invoice_number', 'customer', 'status')
        }),
        ('Dates', {
            'fields': ('invoice_date', 'due_date', 'paid_date')
        }),
        ('Amounts', {
            'fields': ('subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'paid_amount', 'remaining_amount')
        }),
        ('Additional Info', {
            'fields': ('notes', 'terms'),
            'classes': ('collapse',)
        }),
        ('Status Info', {
            'fields': ('is_overdue', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:  # If creating new invoice
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'product', 'quantity', 'unit_price', 'tax_rate', 'total_with_tax']
    list_filter = ['invoice__status', 'tax_rate']
    search_fields = ['invoice__invoice_number', 'product__name', 'product__sku']
    readonly_fields = ['line_total', 'tax_amount', 'total_with_tax']