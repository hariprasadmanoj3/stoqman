from rest_framework import serializers
from .models import Customer, Invoice, InvoiceItem, Payment
from inventory.models import Product

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'email', 'phone', 'address', 'gst_number', 'created_at', 'updated_at']

class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = InvoiceItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'gst_rate', 'line_total', 'gst_amount']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    balance_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name', 'created_by', 'created_by_name',
            'date', 'due_date', 'subtotal', 'total_tax', 'total', 'amount_paid', 'balance_due',
            'status', 'notes', 'items', 'created_at', 'updated_at'
        ]

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'invoice', 'amount', 'payment_method', 'reference_number', 'notes', 'created_by', 'created_at']