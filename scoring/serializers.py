"""
Scoring Serializers - سریالایزرهای امتیازدهی
"""

from rest_framework import serializers
from .models import UserScore, ScoreLog


class UserScoreSerializer(serializers.ModelSerializer):
    """
    سریالایزر امتیاز کاربر
    """
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.profile_image', read_only=True)
    
    class Meta:
        model = UserScore
        fields = [
            'id', 'user', 'user_email', 'user_name', 'user_avatar',
            'total_score', 'ideas_count', 'avg_ai_score', 'rank'
        ]
        read_only_fields = ['id', 'user', 'total_score', 'ideas_count', 'avg_ai_score', 'rank']


class LeaderboardSerializer(serializers.ModelSerializer):
    """
    سریالایزر لیدربورد (رتبه‌بندی)
    """
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_avatar = serializers.ImageField(source='user.profile_image', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = UserScore
        fields = ['rank', 'user', 'user_id', 'user_name', 'user_avatar', 'total_score', 'sum_ai_score', 'avg_ai_score', 'ideas_count']


class ScoreLogSerializer(serializers.ModelSerializer):
    """
    سریالایزر لاگ امتیاز
    """
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = ScoreLog
        fields = ['id', 'action', 'action_display', 'points_change', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']
