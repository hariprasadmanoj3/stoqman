from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, StockMovement
from .serializers import CategorySerializer, ProductSerializer, StockMovementSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'description']

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'price', 'stock_quantity', 'created_at']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        low_stock_products = [p for p in self.get_queryset() if p.is_low_stock]
        serializer = self.get_serializer(low_stock_products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """Update product stock"""
        product = self.get_object()
        movement_type = request.data.get('movement_type')
        quantity = int(request.data.get('quantity', 0))
        reference = request.data.get('reference', '')
        notes = request.data.get('notes', '')
        
        if movement_type == 'in':
            product.stock_quantity += quantity
        elif movement_type == 'out':
            if product.stock_quantity >= quantity:
                product.stock_quantity -= quantity
            else:
                return Response(
                    {'error': 'Insufficient stock'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif movement_type == 'adjustment':
            product.stock_quantity = quantity
            
        product.save()
        
        # Create stock movement record
        StockMovement.objects.create(
            product=product,
            movement_type=movement_type,
            quantity=quantity,
            reference=reference,
            notes=notes,
            created_by=request.user
        )
        
        return Response({'message': 'Stock updated successfully'})

class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockMovement.objects.select_related('product', 'created_by').all()
    serializer_class = StockMovementSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'movement_type']
    ordering = ['-created_at']