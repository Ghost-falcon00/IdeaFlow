from django.contrib import admin
from .models import SubscriptionPlan, UserSubscription, UsageLog


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'is_free', 'is_active', 'ideas_per_day', 'ai_chats_per_day']
    list_filter = ['is_active', 'is_free']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'started_at', 'expires_at', 'is_active']
    list_filter = ['plan']
    search_fields = ['user__email']


@admin.register(UsageLog)
class UsageLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'usage_type', 'date', 'count']
    list_filter = ['usage_type', 'date']
    search_fields = ['user__email']
