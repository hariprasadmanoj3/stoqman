from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'date_joined', 'is_staff', 'is_superuser']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    # Fix the fieldsets - remove any non-existent fields
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone')
        }),
    )
    
    # Add fields for creating new users
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone', 'first_name', 'last_name', 'email')
        }),
    )
    
    # Make role editable in list view
    list_editable = ['role', 'is_active']
    
    # Order by newest first
    ordering = ['-date_joined']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()