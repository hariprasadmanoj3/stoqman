from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role', 
            'phone', 'password', 'shop_name', 'business_type', 'address', 
            'city', 'state', 'country', 'postal_code', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class ShopOwnerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'password', 
            'confirm_password', 'phone', 'shop_name', 'business_type', 
            'address', 'city', 'state', 'country', 'postal_code'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists")
        return value
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data['role'] = 'shop_owner'  # Force role to shop_owner
        validated_data['is_verified'] = True   # Shop owners are verified by default
        validated_data['email_verified'] = True
        
        user = User.objects.create_user(**validated_data)
        return user

class StaffRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 'password', 
            'confirm_password', 'phone', 'role'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists")
        return value
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        validated_data['role'] = 'staff'  # Force role to staff
        validated_data['is_verified'] = False  # Staff needs verification
        
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role', 
            'phone', 'shop_name', 'business_type', 'address', 'city', 
            'state', 'country', 'postal_code', 'created_at', 'updated_at',
            'is_verified', 'email_verified'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'role', 'is_verified', 'email_verified']