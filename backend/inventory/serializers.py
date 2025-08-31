from rest_framework import serializers
from .models import Product, Category
from decimal import Decimal, InvalidOperation

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'product_count', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    is_out_of_stock = serializers.ReadOnlyField()
    price_with_gst = serializers.ReadOnlyField()
    gst_amount = serializers.ReadOnlyField()
    total_value = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'description', 'price', 'stock_quantity', 
            'threshold', 'category', 'category_name', 'image', 'gst_rate',
            'is_low_stock', 'is_out_of_stock', 'price_with_gst', 'gst_amount', 
            'total_value', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_price(self, value):
        """Validate price is a positive decimal"""
        try:
            decimal_value = Decimal(str(value))
            if decimal_value < 0:
                raise serializers.ValidationError("Price cannot be negative.")
            return decimal_value
        except (InvalidOperation, TypeError, ValueError):
            raise serializers.ValidationError("Invalid price format.")

    def validate_gst_rate(self, value):
        """Validate GST rate"""
        try:
            decimal_value = Decimal(str(value))
            if decimal_value < 0 or decimal_value > 100:
                raise serializers.ValidationError("GST rate must be between 0 and 100.")
            return decimal_value
        except (InvalidOperation, TypeError, ValueError):
            raise serializers.ValidationError("Invalid GST rate format.")

    def validate_stock_quantity(self, value):
        """Validate stock quantity is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value

    def validate_threshold(self, value):
        """Validate threshold is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Threshold cannot be negative.")
        return value

    def validate_sku(self, value):
        """Validate SKU uniqueness"""
        if self.instance:
            # For updates, exclude current instance from uniqueness check
            if Product.objects.filter(sku=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A product with this SKU already exists.")
        else:
            # For new products
            if Product.objects.filter(sku=value).exists():
                raise serializers.ValidationError("A product with this SKU already exists.")
        return value

    def create(self, validated_data):
        """Create product with proper user assignment"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)