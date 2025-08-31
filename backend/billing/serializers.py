from rest_framework import serializers
from django.utils import timezone
from datetime import date
from .models import Invoice, InvoiceItem, Customer
from inventory.models import Product
from decimal import Decimal, ROUND_HALF_UP

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'email', 'phone', 'address', 'city', 'state', 
            'postal_code', 'country', 'gstin', 'full_address', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'full_address']


class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_sku = serializers.SerializerMethodField()
    line_total = serializers.ReadOnlyField()
    tax_amount = serializers.ReadOnlyField()
    total_with_tax = serializers.ReadOnlyField()

    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 'description',
            'quantity', 'unit_price', 'tax_rate', 'line_total', 'tax_amount', 'total_with_tax'
        ]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        return value

    def validate_unit_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Unit price cannot be negative")
        return value

    def get_product_name(self, obj):
        return obj.product.name if obj.product else None

    def get_product_sku(self, obj):
        return obj.product.sku if obj.product else None


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    # Allow nested write for items
    items = InvoiceItemSerializer(many=True, required=False)
    is_overdue = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name', 'status',
            'invoice_date', 'due_date', 'paid_date', 'subtotal', 'tax_amount',
            'discount_amount', 'total_amount', 'paid_amount', 'remaining_amount',
            'notes', 'terms', 'items', 'is_overdue', 'created_at', 'updated_at', 'stock_applied'
        ]
        read_only_fields = [
            'invoice_number', 'subtotal', 'tax_amount', 'total_amount',
            'is_overdue', 'remaining_amount', 'created_at', 'updated_at'
        ]

    def validate_due_date(self, value):
        invoice_date = self.initial_data.get('invoice_date')
        if invoice_date:
            # Parse the invoice_date if it's a string
            if isinstance(invoice_date, str):
                try:
                    invoice_date = timezone.datetime.strptime(invoice_date, '%Y-%m-%d').date()
                except ValueError:
                    invoice_date = date.today()
            
            if value < invoice_date:
                raise serializers.ValidationError("Due date cannot be before invoice date")
        
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        # created_by may be passed via serializer.save(created_by=request.user)
        invoice = Invoice.objects.create(**validated_data)
        # Create items if provided
        for item_data in items_data:
            # Allow manual line items without a product
            InvoiceItem.objects.create(
                invoice=invoice,
                product=item_data.get('product'),
                description=item_data.get('description', ''),
                quantity=item_data.get('quantity', 1),
                unit_price=item_data.get('unit_price', 0),
                tax_rate=item_data.get('tax_rate', 0),
            )
        # Recalculate totals and refresh instance
        invoice.calculate_totals()
        invoice.refresh_from_db()
        return invoice

    def update(self, instance, validated_data):
        # Extract nested items from validated data to avoid assigning reverse relation directly
        items_data = validated_data.pop('items', None)
        # Update scalar fields only
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If items provided, replace existing items with new set
        if items_data is not None:
            # Clear existing items
            instance.items.all().delete()
            # Recreate items
            for item in items_data:
                InvoiceItem.objects.create(
                    invoice=instance,
                    product=item.get('product'),
                    description=item.get('description', ''),
                    quantity=item.get('quantity', 1),
                    unit_price=item.get('unit_price', 0),
                    tax_rate=item.get('tax_rate', 0),
                )

        # Recalculate totals and refresh instance
        instance.calculate_totals()
        # Normalize decimals to two places to avoid floating inconsistencies
        instance.subtotal = (Decimal(instance.subtotal).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        instance.tax_amount = (Decimal(instance.tax_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        instance.total_amount = (Decimal(instance.total_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        instance.paid_amount = (Decimal(instance.paid_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
        # Clamp over/underpayment edges
        if instance.paid_amount > instance.total_amount:
            instance.paid_amount = instance.total_amount
        if instance.paid_amount < Decimal('0.00'):
            instance.paid_amount = Decimal('0.00')
        Invoice.objects.filter(id=instance.id).update(
            subtotal=instance.subtotal,
            tax_amount=instance.tax_amount,
            total_amount=instance.total_amount,
            paid_amount=instance.paid_amount,
        )
        instance.refresh_from_db()
        return instance

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        if instance and getattr(instance, 'stock_applied', False):
            if 'items' in self.initial_data:
                raise serializers.ValidationError("Cannot modify items on a finalized invoice")
            # Prevent discount or customer change after stock applied to avoid confusion
            forbidden_fields = []
            for field in ['discount_amount', 'customer']:
                if field in self.initial_data:
                    forbidden_fields.append(field)
            if forbidden_fields:
                raise serializers.ValidationError({
                    'non_field_errors': [
                        f"Cannot modify {', '.join(forbidden_fields)} on a finalized invoice"
                    ]
                })
        return super().validate(attrs)

    def validate_customer(self, value):
        if not value:
            raise serializers.ValidationError("Customer is required")
        return value