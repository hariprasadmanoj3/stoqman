from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet

router = DefaultRouter()
# Register at root so paths are /api/reports/<action>/, not /api/reports/reports/<action>/
router.register(r'', ReportViewSet, basename='reports')

urlpatterns = [
    path('', include(router.urls)),
]