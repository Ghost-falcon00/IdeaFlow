"""
Accounts Serializers - سریالایزرهای کاربری
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    سریالایزر نمایش اطلاعات کاربر
    """
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'full_name', 'profile_image', 'bio', 'phone_number', 
            'is_staff', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'email', 'created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    سریالایزر ثبت‌نام کاربر
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'رمزعبور و تأیید آن مطابقت ندارند.'
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """
    سریالایزر تغییر رمزعبور
    """
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(
        required=True, 
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('رمزعبور فعلی اشتباه است.')
        return value


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    سریالایزر بروزرسانی پروفایل
    """
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'profile_image', 'bio', 'phone_number']


class GoogleAuthSerializer(serializers.Serializer):
    """
    سریالایزر ورود با گوگل
    """
    token = serializers.CharField(required=True, help_text="Google ID Token")


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    سریالایزر درخواست بازیابی رمزعبور
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            # For security, don't reveal if email exists
            pass
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    سریالایزر تأیید بازیابی رمزعبور
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'رمزعبور و تأیید آن مطابقت ندارند.'
            })
        return attrs
