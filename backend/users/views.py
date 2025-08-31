from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    UserSerializer, 
    ShopOwnerRegistrationSerializer, 
    StaffRegistrationSerializer,
    UserProfileSerializer
)
from .permissions import IsShopOwnerOrAdmin

User = get_user_model()

class ShopOwnerRegistrationView(APIView):
    """Allow shop owners to register"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = ShopOwnerRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Shop owner registered successfully!',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StaffRegistrationView(APIView):
    """Allow shop owners/admins to register staff members"""
    permission_classes = [IsShopOwnerOrAdmin]
    
    def post(self, request):
        serializer = StaffRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            return Response({
                'message': 'Staff member registered successfully!',
                'user': UserProfileSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.action == 'create':
            # Only shop owners and admins can create users
            return [IsShopOwnerOrAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Users can update their own profile, admins can update anyone
            return [permissions.IsAuthenticated()]
        return super().get_permissions()
    
    def get_queryset(self):
        """Filter users based on role"""
        user = self.request.user
        if user.is_admin:
            return User.objects.all()
        else:
            # Staff can only see themselves
            return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """Get or update current user profile"""
        if request.method.lower() == 'get':
            serializer = UserProfileSerializer(request.user)
            return Response(serializer.data)
        
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def staff(self, request):
        """Get list of staff members (shop owners and admins only)"""
        if not request.user.is_admin:
            return Response(
                {'detail': 'You do not have permission to view staff list'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        staff_users = User.objects.filter(role='staff')
        serializer = UserProfileSerializer(staff_users, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify a staff member (shop owners and admins only)"""
        if not request.user.is_admin:
            return Response(
                {'detail': 'You do not have permission to verify users'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = self.get_object()
            if user.role == 'staff':
                user.is_verified = True
                user.save()
                return Response({
                    'message': f'User {user.username} has been verified successfully!'
                })
            else:
                return Response({
                    'detail': 'Only staff members can be verified'
                }, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )