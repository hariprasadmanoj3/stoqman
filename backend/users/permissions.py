from rest_framework import permissions

class IsShopOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow shop owners and admins to perform actions.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Allow shop owners and admins
        return request.user.is_admin
    
    def has_object_permission(self, request, view, obj):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Shop owners and admins can access any object
        if request.user.is_admin:
            return True
        
        # Users can only access their own objects
        return obj == request.user

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow object owners and admins to perform actions.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Allow all authenticated users
        return True
    
    def has_object_permission(self, request, view, obj):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Shop owners and admins can access any object
        if request.user.is_admin:
            return True
        
        # Check if the object has a created_by field
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user
        
        # Check if the object has a user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # If no ownership field, deny access
        return False

class IsAdminOnly(permissions.BasePermission):
    """
    Custom permission to allow only admins to perform actions.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Only allow shop owners and admins
        return request.user.is_admin
    
    def has_object_permission(self, request, view, obj):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Only allow shop owners and admins
        return request.user.is_admin