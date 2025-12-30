"""
Ideas Admin - پنل مدیریت ایده‌ها
"""

from django.contrib import admin
from .models import Idea, Category, IdeaTag


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon']
    prepopulated_fields = {'slug': ('name',)}


class IdeaTagInline(admin.TabularInline):
    model = IdeaTag
    extra = 1


@admin.register(Idea)
class IdeaAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'visibility', 'ai_score', 'similar_count', 'created_at']
    list_filter = ['visibility', 'category', 'created_at']
    search_fields = ['title', 'description', 'user__email']
    ordering = ['-created_at']
    inlines = [IdeaTagInline]
    
    fieldsets = (
        (None, {
            'fields': ('user', 'title', 'description', 'category', 'visibility')
        }),
        ('تحلیل AI', {
            'fields': ('ai_score', 'ai_feedback', 'similar_count'),
            'classes': ('collapse',)
        }),
    )
