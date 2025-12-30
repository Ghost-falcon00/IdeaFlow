"""
URL configuration for IdeaFlow project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/accounts/', include('accounts.urls', namespace='accounts')),
    path('api/ideas/', include('ideas.urls', namespace='ideas')),
    path('api/scoring/', include('scoring.urls', namespace='scoring')),
    path('api/support/', include('support.urls')),
    path('api/admin-panel/', include('admin_panel.urls')),
    path('api/subscriptions/', include('subscriptions.urls', namespace='subscriptions')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
