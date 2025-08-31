from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.http import JsonResponse

# Import viewsets
from inventory.views import ProductViewSet, CategoryViewSet
from billing.views import InvoiceViewSet, CustomerViewSet, InvoiceItemViewSet
from users.views import UserViewSet, ShopOwnerRegistrationView, StaffRegistrationView

# Create router and register viewsets
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'invoice-items', InvoiceItemViewSet, basename='invoiceitem')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'users', UserViewSet, basename='user')

def health_check(request):
    return JsonResponse({"status": "healthy"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # Authentication endpoints
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/shop-owner/', ShopOwnerRegistrationView.as_view(), name='shop_owner_register'),
    path('api/auth/register/staff/', StaffRegistrationView.as_view(), name='staff_register'),
    
    path('api/reports/', include('reports.urls')),
    path('api/health/', health_check, name='health_check'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
