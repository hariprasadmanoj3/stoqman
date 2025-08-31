from django.contrib import admin
from .models import Category, Product

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'product_count', 'created_at']
    search_fields = ['name', 'description']
    list_filter = ['created_at']
    ordering = ['name']
    readonly_fields = ['created_at', 'updated_at']

    def product_count(self, obj):
        return obj.product_count
    product_count.short_description = 'Number of Products'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'sku', 'category', 'price', 'stock_quantity', 
        'threshold', 'low_stock_status', 'created_at'
    ]
    list_filter = [
        'category', 'created_at'
    ]
    search_fields = ['name', 'sku', 'description']
    list_editable = ['price', 'stock_quantity', 'threshold']
    readonly_fields = [
        'created_at', 'updated_at', 'is_low_stock', 'is_out_of_stock',
        'price_with_gst', 'gst_amount', 'total_value'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'sku', 'description', 'category', 'image')
        }),
        ('Pricing', {
            'fields': ('price', 'gst_rate', 'price_with_gst', 'gst_amount')
        }),
        ('Inventory', {
            'fields': ('stock_quantity', 'threshold', 'total_value')
        }),
        ('Status', {
            'fields': ('is_low_stock', 'is_out_of_stock'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def low_stock_status(self, obj):
        """Display stock status with colors"""
        if obj.is_out_of_stock:
            return "🔴 Out of Stock"
        elif obj.is_low_stock:
            return "🟡 Low Stock"
        else:
            return "🟢 In Stock"
    
    low_stock_status.short_description = 'Stock Status'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'created_by')

    def save_model(self, request, obj, form, change):
        if not change:  # If creating new product
            obj.created_by = request.user
        super().save_model(request, obj, form, change)