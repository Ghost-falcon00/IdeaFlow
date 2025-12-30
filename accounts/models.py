"""
Accounts Models - مدل‌های کاربری
"""

from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    """
    مدل کاربر سفارشی با فیلدهای اضافی برای پروفایل
    """
    email = models.EmailField(unique=True, verbose_name='ایمیل')
    profile_image = models.ImageField(
        upload_to='profiles/%Y/%m/', 
        null=True, 
        blank=True,
        verbose_name='تصویر پروفایل'
    )
    bio = models.TextField(
        max_length=500, 
        blank=True,
        verbose_name='درباره من'
    )
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        verbose_name='شماره تلفن'
    )
    
    # OAuth fields for Google login
    google_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ثبت‌نام')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخرین بروزرسانی')
    
    # Use email for login
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'کاربر'
        verbose_name_plural = 'کاربران'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        """برگرداندن نام کامل کاربر"""
        if self.first_name or self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.username
