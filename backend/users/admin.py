from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth import get_user_model
from django.utils.html import format_html

User = get_user_model()

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'username', 'email', 'full_name', 'role', 'shop_name', 
        'is_verified', 'is_active', 'created_at'
    ]
    list_filter = [
        'role', 'is_verified', 'is_active', 'email_verified', 
        'created_at', 'business_type', 'city', 'state'
    ]
    search_fields = [
        'username', 'email', 'first_name', 'last_name', 
        'shop_name', 'phone', 'address'
    ]
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone')
        }),
        ('Business Information', {
            'fields': ('shop_name', 'business_type', 'address', 'city', 'state', 'country', 'postal_code'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('role', 'is_active', 'is_verified', 'email_verified', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role'),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'last_login', 'date_joined']
    
    def full_name(self, obj):
        return obj.full_name
    full_name.short_description = 'Full Name'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related()
    
    actions = ['verify_users', 'activate_users', 'deactivate_users']
    
    def verify_users(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f'{updated} users have been verified successfully.')
    verify_users.short_description = "Verify selected users"
    
    def activate_users(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} users have been activated successfully.')
    activate_users.short_description = "Activate selected users"
    
    def deactivate_users(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} users have been deactivated successfully.')
    deactivate_users.short_description = "Deactivate selected users"