from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, F
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from billing.models import Invoice, InvoiceItem
from inventory.models import Product, Category
from users.permissions import IsAdminOnly

class ReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminOnly]
    
    @action(detail=False, methods=['get'])
    def sales_summary(self, request):
        """Get sales summary for dashboard"""
        # Get date range from query params
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=30)
        else:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            except ValueError:
                start_date = timezone.now().date() - timedelta(days=30)
            
        if not end_date:
            end_date = timezone.now().date()
        else:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                end_date = timezone.now().date()
        
        # Get invoice data
        invoices = Invoice.objects.filter(
            invoice_date__gte=start_date,
            invoice_date__lte=end_date
        )
        
        total_revenue = invoices.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')
        
        paid_invoices_count = invoices.filter(status='paid').count()
        pending_invoices_count = invoices.filter(status__in=['due', 'partial']).count()
        
        avg_invoice_value = invoices.aggregate(
            avg=Avg('total_amount')
        )['avg'] or Decimal('0.00')
        
        summary = {
            'total_revenue': float(total_revenue),
            'total_invoices': invoices.count(),
            'paid_invoices': paid_invoices_count,
            'pending_invoices': pending_invoices_count,
            'average_invoice_value': float(avg_invoice_value),
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        }
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def inventory_summary(self, request):
        """Get inventory summary"""
        products = Product.objects.all()
        
        total_inventory_value = sum(
            float(product.price or 0) * int(product.stock_quantity or 0)
            for product in products
        )
        
        low_stock_products = products.filter(
            stock_quantity__lte=F('threshold')
        ).count()
        
        out_of_stock_products = products.filter(stock_quantity=0).count()
        
        summary = {
            'total_products': products.count(),
            'total_inventory_value': total_inventory_value,
            'low_stock_products': low_stock_products,
            'out_of_stock_products': out_of_stock_products,
        }
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def customer_analytics(self, request):
        """Get customer analytics"""
        from billing.models import Customer
        
        customers = Customer.objects.all()
        total_customers = customers.count()
        
        # Get date range for new customers
        start_date = request.query_params.get('start_date')
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                new_customers = customers.filter(
                    created_at__gte=start_date
                ).count()
            except ValueError:
                new_customers = 0
        else:
            # Default to last 30 days
            start_date = timezone.now().date() - timedelta(days=30)
            new_customers = customers.filter(
                created_at__gte=start_date
            ).count()
        
        return Response({
            'total_customers': total_customers,
            'new_customers': new_customers,
        })
    
    @action(detail=False, methods=['get'])
    def category_performance(self, request):
        """Get category performance data"""
        categories = Category.objects.all()
        performance_data = []
        
        for category in categories:
            products = Product.objects.filter(category=category)
            total_value = sum(
                float(product.price or 0) * int(product.stock_quantity or 0)
                for product in products
            )
            
            performance_data.append({
                'category_name': category.name,
                'product_count': products.count(),
                'total_value': total_value,
                'low_stock_count': products.filter(
                    stock_quantity__lte=F('threshold')
                ).count(),
            })
        
        return Response(performance_data)