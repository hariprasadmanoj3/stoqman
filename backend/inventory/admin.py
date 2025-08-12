from django.contrib import admin
from .models import Category, Product, StockMovement

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'stock_quantity', 'price', 'is_low_stock', 'is_active']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'sku']
    list_editable = ['price', 'stock_quantity', 'is_active']

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'reference', 'created_by', 'created_at']
    list_filter = ['movement_type', 'created_at']
    readonly_fields = ['created_at']