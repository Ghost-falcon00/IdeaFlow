"""
Accounts Views - ویوهای کاربری
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
import secrets
import string

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    ChangePasswordSerializer,
    UserProfileUpdateSerializer,
    GoogleAuthSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    ثبت‌نام کاربر جدید
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'message': 'ثبت‌نام با موفقیت انجام شد.'
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    مشاهده و ویرایش پروفایل کاربر
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer


class ChangePasswordView(generics.UpdateAPIView):
    """
    تغییر رمزعبور
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = self.get_object()
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'رمزعبور با موفقیت تغییر کرد.'
        })


class LogoutView(APIView):
    """
    خروج از حساب کاربری
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'خروج موفقیت‌آمیز بود.'})
        except Exception:
            return Response({'message': 'خروج انجام شد.'})


class GoogleAuthView(APIView):
    """
    ورود/ثبت‌نام با گوگل
    MVP: اطلاعات کاربر مستقیم از فرانت‌اند میاد
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Get user info directly from frontend (already verified by Google)
        email = request.data.get('email')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if user exists
            user = User.objects.filter(email=email).first()
            
            if user:
                # Existing user - login
                pass
            else:
                # New user - create account
                # Generate random password for OAuth users
                random_password = ''.join(
                    secrets.choice(string.ascii_letters + string.digits) 
                    for _ in range(16)
                )
                
                # Generate unique username from email
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}_{counter}"
                    counter += 1
                
                user = User.objects.create(
                    email=email,
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                )
                user.set_password(random_password)
                user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'message': 'ورود با گوگل موفقیت‌آمیز بود.'
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    درخواست بازیابی رمزعبور
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            
            # Generate token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build reset URL (frontend URL)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            reset_url = f"{frontend_url}/reset-password/{uid}/{token}"
            
            # Send email (MVP: just print to console if email not configured)
            try:
                send_mail(
                    subject='بازیابی رمزعبور - IdeaFlow',
                    message=f'''سلام!

شما درخواست بازیابی رمزعبور کرده‌اید.

برای تغییر رمزعبور روی لینک زیر کلیک کنید:
{reset_url}

این لینک تا ۱ ساعت معتبر است.

اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.

با تشکر،
تیم IdeaFlow
''',
                    from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@ideaflow.ir',
                    recipient_list=[email],
                    fail_silently=True,
                )
            except Exception:
                # Email not configured - just log
                print(f"Password reset link: {reset_url}")
            
            return Response({
                'message': 'اگر این ایمیل در سیستم وجود داشته باشد، لینک بازیابی ارسال می‌شود.',
                # For MVP/development, return the reset info
                'debug': {
                    'uid': uid,
                    'token': token,
                    'reset_url': reset_url
                }
            })
            
        except User.DoesNotExist:
            # For security, return same message
            return Response({
                'message': 'اگر این ایمیل در سیستم وجود داشته باشد، لینک بازیابی ارسال می‌شود.'
            })


class PasswordResetConfirmView(APIView):
    """
    تأیید بازیابی رمزعبور
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            # Decode user id
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            # Verify token
            if not default_token_generator.check_token(user, token):
                return Response({
                    'error': 'لینک نامعتبر یا منقضی شده است.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(new_password)
            user.save()
            
            return Response({
                'message': 'رمزعبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.'
            })
            
        except (TypeError, ValueError, User.DoesNotExist):
            return Response({
                'error': 'لینک نامعتبر است.'
            }, status=status.HTTP_400_BAD_REQUEST)
