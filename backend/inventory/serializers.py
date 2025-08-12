from rest_framework import serializers
from .models import Category, Product, StockMovement

class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='products.count', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'products_count', 'created_at', 'updated_at']

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    price_with_gst = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'category', 'category_name', 'description',
            'stock_quantity', 'price', 'gst_rate', 'threshold', 'is_active',
            'is_low_stock', 'price_with_gst', 'created_at', 'updated_at'
        ]

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type', 'quantity',
            'reference', 'notes', 'created_by', 'created_by_name', 'created_at'
        ]