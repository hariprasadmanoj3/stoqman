from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from django.db import transaction
from .models import Invoice, InvoiceItem, Customer
from .serializers import InvoiceSerializer, CustomerSerializer, InvoiceItemSerializer
from inventory.models import Product
from users.permissions import IsOwnerOrAdmin

class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'email', 'phone', 'gstin']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Filter customers by the current user's shop"""
        user = self.request.user
        if user.is_admin:
            return Customer.objects.all()
        else:
            return Customer.objects.filter(shop=user)

    def perform_create(self, serializer):
        """Automatically set the shop when creating customers"""
        serializer.save(shop=self.request.user)

    def perform_destroy(self, instance):
        # Prevent deleting customers that have invoices
        if instance.invoices.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Cannot delete customer with existing invoices'})
        return super().perform_destroy(instance)


class InvoiceItemViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter invoice items by the current user's shop"""
        user = self.request.user
        if user.is_admin:
            return InvoiceItem.objects.select_related('invoice', 'product')
        else:
            return InvoiceItem.objects.filter(invoice__shop=user).select_related('invoice', 'product')

    def perform_create(self, serializer):
        """Create invoice item and update totals"""
        item = serializer.save()
        # Totals will be automatically updated by the model's save method
        
    def perform_update(self, serializer):
        """Update invoice item and recalculate totals"""
        item = serializer.save()
        # Totals will be automatically updated by the model's save method

    def perform_destroy(self, instance):
        """Delete invoice item and update totals"""
        invoice = instance.invoice
        instance.delete()
        # Totals will be automatically updated by the model's delete method


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsOwnerOrAdmin]
    search_fields = ['invoice_number', 'customer__name']
    ordering_fields = ['created_at', 'due_date', 'total_amount']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter invoices by the current user's shop"""
        user = self.request.user
        if user.is_admin:
            queryset = Invoice.objects.select_related('customer', 'created_by').prefetch_related('items__product')
        else:
            queryset = Invoice.objects.filter(shop=user).select_related('customer', 'created_by').prefetch_related('items__product')
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset

    def perform_create(self, serializer):
        """Create invoice with auto-generated number and shop"""
        invoice = serializer.save(created_by=self.request.user, shop=self.request.user)
        # Ensure computed totals are up to date when items are nested
        invoice.refresh_from_db()

    def destroy(self, request, *args, **kwargs):
        invoice = self.get_object()
        if invoice.stock_applied:
            return Response({'error': 'Cannot delete a finalized invoice'}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add item to invoice"""
        with transaction.atomic():
            # Lock invoice row for concurrent modifications to totals/items
            invoice = Invoice.objects.select_for_update().get(pk=pk)

            if invoice.stock_applied:
                return Response({'error': 'Invoice is finalized; items cannot be modified.'}, status=status.HTTP_400_BAD_REQUEST)
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity', 1))
            
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if item already exists
            existing_item = InvoiceItem.objects.filter(invoice=invoice, product=product).select_for_update().first()
            if existing_item:
                existing_item.quantity += quantity
                existing_item.save()
                message = 'Item quantity updated successfully'
            else:
                # Create new invoice item
                InvoiceItem.objects.create(
                    invoice=invoice,
                    product=product,
                    quantity=quantity,
                    unit_price=product.price,
                    tax_rate=getattr(product, 'gst_rate', 18),
                    description=product.name
                )
                message = 'Item added successfully'
            
            # Refresh invoice and return updated data
            invoice.refresh_from_db()
            serializer = self.get_serializer(invoice)
            return Response({
                'message': message,
                'invoice': serializer.data
            })

    @action(detail=True, methods=['delete'])
    def remove_item(self, request, pk=None):
        """Remove item from invoice"""
        with transaction.atomic():
            invoice = Invoice.objects.select_for_update().get(pk=pk)

            if invoice.stock_applied:
                return Response({'error': 'Invoice is finalized; items cannot be modified.'}, status=status.HTTP_400_BAD_REQUEST)
            item_id = request.data.get('item_id')
            
            try:
                item = InvoiceItem.objects.select_for_update().get(id=item_id, invoice=invoice)
                item.delete()
                
                # Refresh invoice and return updated data
                invoice.refresh_from_db()
                serializer = self.get_serializer(invoice)
                return Response({
                    'message': 'Item removed successfully',
                    'invoice': serializer.data
                })
            except InvoiceItem.DoesNotExist:
                return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending invoices"""
        pending_invoices = self.get_queryset().filter(status__in=['due', 'partial'])
        serializer = self.get_serializer(pending_invoices, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue invoices"""
        today = timezone.now().date()
        overdue_invoices = self.get_queryset().filter(
            status__in=['due', 'partial'],
            due_date__lt=today
        )
        serializer = self.get_serializer(overdue_invoices, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark invoice as paid"""
        invoice = self.get_object()
        
        if invoice.status == 'paid':
            return Response(
                {'error': 'Invoice is already paid'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create a payment to mark as paid for audit trail
        from decimal import Decimal
        from .models import Payment
        Payment.objects.create(
            invoice=invoice,
            amount=Decimal(invoice.total_amount) - Decimal(invoice.paid_amount),
            payment_method='cash',
            reference_number='MARK_PAID',
            notes='Marked fully paid',
            created_by=self.request.user,
        )
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        """Finalize invoice: apply stock adjustments and move status to due if draft"""
        invoice = self.get_object()
        if invoice.stock_applied:
            return Response({'error': 'Invoice already finalized'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            invoice.apply_stock_adjustments()
            invoice.refresh_from_db()
            serializer = self.get_serializer(invoice)
            return Response({'message': 'Invoice finalized and stock updated', 'invoice': serializer.data})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def partial_payment(self, request, pk=None):
        """Record partial payment"""
        invoice = self.get_object()
        amount = request.data.get('amount', 0)
        
        try:
            amount = float(amount)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid amount'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount <= 0:
            return Response(
                {'error': 'Invalid payment amount'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Apply with rounding to 2 decimals and clamp to not exceed total
        from decimal import Decimal, ROUND_HALF_UP
        invoice.paid_amount = (Decimal(invoice.paid_amount) + Decimal(str(amount))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        if invoice.paid_amount >= invoice.total_amount:
            invoice.status = 'paid'
            invoice.paid_date = timezone.now().date()
            # clamp exact to total
            invoice.paid_amount = invoice.total_amount
        else:
            invoice.status = 'partial'
        
        invoice.save()
        # Create a payment record for audit
        from .models import Payment
        Payment.objects.create(
            invoice=invoice,
            amount=Decimal(str(amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
            payment_method=request.data.get('payment_method', 'cash'),
            reference_number=request.data.get('reference_number', ''),
            notes=request.data.get('notes', ''),
            created_by=self.request.user,
        )
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)