from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from .models import Customer, Invoice, InvoiceItem, Payment
from .serializers import CustomerSerializer, InvoiceSerializer, PaymentSerializer
from inventory.models import Product, StockMovement

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'email', 'phone']

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related('customer', 'created_by').prefetch_related('items').all()
    serializer_class = InvoiceSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'customer']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add item to invoice"""
        invoice = self.get_object()
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check stock availability
        if product.stock_quantity < quantity:
            return Response({'error': 'Insufficient stock'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create invoice item
        invoice_item = InvoiceItem.objects.create(
            invoice=invoice,
            product=product,
            quantity=quantity,
            unit_price=product.price,
            gst_rate=product.gst_rate
        )
        
        # Update invoice totals
        self._update_invoice_totals(invoice)
        
        return Response({'message': 'Item added successfully'})
    
    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """Finalize invoice and update stock"""
        invoice = self.get_object()
        
        if invoice.status != 'draft':
            return Response({'error': 'Invoice already finalized'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update stock for each item
        for item in invoice.items.all():
            product = item.product
            if product.stock_quantity >= item.quantity:
                product.stock_quantity -= item.quantity
                product.save()
                
                # Create stock movement
                StockMovement.objects.create(
                    product=product,
                    movement_type='out',
                    quantity=item.quantity,
                    reference=invoice.invoice_number,
                    notes=f'Sale - Invoice {invoice.invoice_number}',
                    created_by=request.user
                )
            else:
                return Response(
                    {'error': f'Insufficient stock for {product.name}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        invoice.status = 'due'
        invoice.save()
        
        return Response({'message': 'Invoice finalized successfully'})
    
    def _update_invoice_totals(self, invoice):
        """Update invoice subtotal, tax, and total"""
        items = invoice.items.all()
        subtotal = sum(item.line_total for item in items)
        total_tax = sum(item.gst_amount for item in items)
        total = subtotal + total_tax
        
        invoice.subtotal = subtotal
        invoice.total_tax = total_tax
        invoice.total = total
        invoice.save()

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('invoice', 'created_by').all()
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['invoice', 'payment_method']
    
    def perform_create(self, serializer):
        payment = serializer.save(created_by=self.request.user)
        
        # Update invoice amount paid
        invoice = payment.invoice
        invoice.amount_paid += payment.amount
        
        # Update invoice status
        if invoice.amount_paid >= invoice.total:
            invoice.status = 'paid'
        elif invoice.amount_paid > 0:
            invoice.status = 'partial'
        
        invoice.save()