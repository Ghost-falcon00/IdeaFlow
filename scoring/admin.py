"""
Scoring Admin - پنل مدیریت امتیازها
"""

from django.contrib import admin
from .models import UserScore, ScoreLog


@admin.register(UserScore)
class UserScoreAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_score', 'ideas_count', 'avg_ai_score', 'rank', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['user__email', 'user__username']
    ordering = ['rank', '-total_score']
    readonly_fields = ['total_score', 'ideas_count', 'avg_ai_score']


@admin.register(ScoreLog)
class ScoreLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'points_change', 'description', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email', 'description']
    ordering = ['-created_at']
