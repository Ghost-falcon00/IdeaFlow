"""
Ideas URLs - مسیرهای ایده‌ها
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views
from . import marketplace_views

app_name = 'ideas'

router = DefaultRouter()
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'', views.IdeaViewSet, basename='idea')

# Marketplace routes
marketplace_router = DefaultRouter()
marketplace_router.register(r'explore', marketplace_views.ExploreViewSet, basename='explore')
marketplace_router.register(r'investments', marketplace_views.InvestmentRequestViewSet, basename='investment')
marketplace_router.register(r'comments', marketplace_views.CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    path('marketplace/', include(marketplace_router.urls)),
]
