from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.AdminUserViewSet, basename='admin-user')
router.register(r'ideas', views.AdminIdeaViewSet, basename='admin-idea')
router.register(r'tickets', views.AdminTicketViewSet, basename='admin-ticket')

urlpatterns = [
    path('', include(router.urls)),
]
