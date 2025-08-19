from rest_framework import viewsets, permissions, status, filters
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'price', 'stock_quantity', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Product.objects.select_related('category', 'created_by')
        
        # Filter by stock status
        stock_status = self.request.query_params.get('stock_status', None)
        if stock_status == 'low_stock':
            queryset = queryset.filter(stock_quantity__lte=F('threshold'))
        elif stock_status == 'out_of_stock':
            queryset = queryset.filter(stock_quantity=0)
        elif stock_status == 'in_stock':
            queryset = queryset.filter(stock_quantity__gt=F('threshold'))
        
        return queryset

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        low_stock_products = self.get_queryset().filter(
            stock_quantity__lte=F('threshold')
        )
        serializer = self.get_serializer(low_stock_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get products that are out of stock"""
        out_of_stock_products = self.get_queryset().filter(stock_quantity=0)
        serializer = self.get_serializer(out_of_stock_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update products"""
        product_ids = request.data.get('product_ids', [])
        update_data = request.data.get('update_data', {})
        
        if not product_ids:
            return Response(
                {'error': 'No product IDs provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            products = Product.objects.filter(id__in=product_ids)
            updated_count = products.update(**update_data)
            
            return Response({
                'message': f'Successfully updated {updated_count} products',
                'updated_count': updated_count
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Bulk delete products"""
        product_ids = request.data.get('product_ids', [])
        
        if not product_ids:
            return Response(
                {'error': 'No product IDs provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            products = Product.objects.filter(id__in=product_ids)
            deleted_count = products.count()
            products.delete()
            
            return Response({
                'message': f'Successfully deleted {deleted_count} products',
                'deleted_count': deleted_count
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        """Set the created_by field to current user"""
        serializer.save(created_by=self.request.user)