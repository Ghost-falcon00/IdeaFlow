"""
Subscriptions URLs - مسیرهای اشتراک
"""

from django.urls import path
from . import views

app_name = 'subscriptions'

urlpatterns = [
    path('plans/', views.SubscriptionPlanListView.as_view(), name='plan_list'),
    path('my-subscription/', views.UserSubscriptionView.as_view(), name='my_subscription'),
    path('limits/', views.RemainingLimitsView.as_view(), name='remaining_limits'),
]
