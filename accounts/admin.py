"""
Accounts Admin - پنل مدیریت کاربران
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = UserAdmin.fieldsets + (
        ('اطلاعات اضافی', {
            'fields': ('profile_image', 'bio', 'google_id')
        }),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('اطلاعات اضافی', {
            'fields': ('email', 'profile_image', 'bio')
        }),
    )
