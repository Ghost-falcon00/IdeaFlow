from rest_framework import serializers
from django.contrib.auth import get_user_model
from ideas.models import Idea
from support.models import SupportTicket, TicketMessage
from support.serializers import TicketMessageSerializer
from subscriptions.models import UserSubscription, SubscriptionPlan

User = get_user_model()

class AdminUserSerializer(serializers.ModelSerializer):
    """
    سریالایزر کاربر برای ادمین
    """
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone_number', 'is_active', 'is_staff', 'date_joined']
        
class AdminIdeaSerializer(serializers.ModelSerializer):
    """
    سریالایزر ایده برای ادمین
    """
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Idea
        fields = '__all__'

class AdminTicketSerializer(serializers.ModelSerializer):
    """
    سریالایزر تیکت برای ادمین
    """
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'user', 'user_email', 'user_name', 'subject', 'status', 'priority', 'created_at', 'updated_at', 'messages']
        
class AdminSubscriptionSerializer(serializers.ModelSerializer):
    """
    سریالایزر اشتراک برای ادمین (برای دادن اشتراک دستی)
    """
    plan_slug = serializers.CharField(write_only=True)
    duration_days = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = UserSubscription
        fields = ['id', 'user', 'plan', 'start_date', 'end_date', 'is_active', 'plan_slug', 'duration_days']
        read_only_fields = ['id', 'plan', 'start_date', 'end_date', 'is_active'] 
