from rest_framework import viewsets, permissions, status, filters
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from .models import Product, Category
from users.permissions import IsOwnerOrAdmin, IsAdminOnly
from .serializers import ProductSerializer, CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    # Shop owners and admins can modify; staff can read
    permission_classes = [IsOwnerOrAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        """Filter categories by the current user's shop"""
        user = self.request.user
        if user.is_admin:
            return Category.objects.all()
        else:
            return Category.objects.filter(shop=user)

    def perform_create(self, serializer):
        """Automatically set the shop when creating categories"""
        serializer.save(shop=self.request.user)

    def perform_destroy(self, instance):
        # Prevent deleting categories that still have products
        if instance.products.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'Cannot delete category with products'})
        return super().perform_destroy(instance)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    # Shop owners and admins can modify; staff can read
    permission_classes = [IsOwnerOrAdmin]
    parser_classes = (MultiPartParser, FormParser)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'price', 'stock_quantity', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter products by the current user's shop"""
        user = self.request.user
        if user.is_admin:
            queryset = Product.objects.select_related('category', 'created_by')
        else:
            queryset = Product.objects.filter(shop=user).select_related('category', 'created_by')
        
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
        if not request.user or request.user.role != 'admin':
            return Response({'error': 'Only admin can bulk update products'}, status=status.HTTP_403_FORBIDDEN)
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
        if not request.user or request.user.role != 'admin':
            return Response({'error': 'Only admin can bulk delete products'}, status=status.HTTP_403_FORBIDDEN)
        product_ids = request.data.get('product_ids', [])
        
        if not product_ids:
            return Response(
                {'error': 'No product IDs provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Prevent deleting products referenced by invoices
            from billing.models import InvoiceItem
            referenced_ids = set(InvoiceItem.objects.filter(product_id__in=product_ids).values_list('product_id', flat=True))
            blocked_ids = [pid for pid in product_ids if pid in referenced_ids]
            if blocked_ids:
                return Response(
                    {'error': 'Cannot delete products referenced in invoices', 'product_ids': blocked_ids},
                    status=status.HTTP_400_BAD_REQUEST
                )
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
        """Automatically set the shop and created_by when creating products"""
        serializer.save(shop=self.request.user, created_by=self.request.user)