"""
Subscriptions Views - ویوهای اشتراک
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import SubscriptionPlan, UserSubscription
from .serializers import (
    SubscriptionPlanSerializer,
    UserSubscriptionSerializer,
    RemainingLimitsSerializer,
)
from .services import LimitService


class SubscriptionPlanListView(generics.ListAPIView):
    """لیست پلن‌های اشتراک"""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]


class UserSubscriptionView(generics.RetrieveAPIView):
    """مشاهده اشتراک فعلی کاربر"""
    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        try:
            return self.request.user.subscription
        except UserSubscription.DoesNotExist:
            return None
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return Response({
            'plan': None,
            'is_active': False,
            'message': 'شما در پلن رایگان هستید.'
        })


class RemainingLimitsView(APIView):
    """مشاهده محدودیت‌های باقیمانده"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limits = LimitService.get_remaining_limits(request.user)
        serializer = RemainingLimitsSerializer(limits)
        return Response(serializer.data)
