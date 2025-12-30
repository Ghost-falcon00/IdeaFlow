"""
Subscriptions Serializers - سریالایزرهای اشتراک
"""

from rest_framework import serializers
from .models import SubscriptionPlan, UserSubscription


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """سریالایزر پلن‌های اشتراک"""
    
    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'is_free',
            'ideas_per_day', 'ai_chats_per_day', 'ai_scoring_attempts',
            'custom_fields_per_idea', 'is_featured'
        ]


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """سریالایزر اشتراک کاربر"""
    plan = SubscriptionPlanSerializer(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = UserSubscription
        fields = ['id', 'plan', 'started_at', 'expires_at', 'is_active']


class RemainingLimitsSerializer(serializers.Serializer):
    """سریالایزر محدودیت‌های باقیمانده"""
    ideas_remaining = serializers.IntegerField()
    ideas_limit = serializers.IntegerField()
    chats_remaining = serializers.IntegerField()
    chats_limit = serializers.IntegerField()
    scoring_attempts = serializers.IntegerField()
    custom_fields_limit = serializers.IntegerField()
