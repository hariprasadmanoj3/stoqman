from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    Staff can only read.
    """
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Admin can do everything
        if request.user.role == 'admin':
            return True
        
        # Staff can only read (GET, HEAD, OPTIONS)
        if request.user.role == 'staff':
            return request.method in permissions.SAFE_METHODS
        
        return False

    def has_object_permission(self, request, view, obj):
        # Admin can do everything
        if request.user.role == 'admin':
            return True
        
        # Staff can only read
        if request.user.role == 'staff':
            return request.method in permissions.SAFE_METHODS
        
        return False

class IsAdminOnly(permissions.BasePermission):
    """
    Only admin users can access
    """
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                request.user.role == 'admin')

class IsStaffOrAdmin(permissions.BasePermission):
    """
    Both staff and admin can access
    """
    def has_permission(self, request, view):
        return (request.user.is_authenticated and 
                request.user.role in ['admin', 'staff'])

class CanCreateInvoices(permissions.BasePermission):
    """
    Staff can create/edit invoices but only admins can delete
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Both admin and staff can access
        if request.user.role in ['admin', 'staff']:
            # Only admin can delete
            if request.method == 'DELETE':
                return request.user.role == 'admin'
            return True
        
        return False

class CanManageInventory(permissions.BasePermission):
    """
    Admin: Full access, Staff: Read-only except for stock updates
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Admin can do everything
        if request.user.role == 'admin':
            return True
        
        # Staff can read and update stock
        if request.user.role == 'staff':
            # Allow stock updates
            if view.action == 'update_stock':
                return True
            # Allow reading
            return request.method in permissions.SAFE_METHODS
        
        return False