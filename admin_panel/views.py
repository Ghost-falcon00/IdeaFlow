from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from ideas.models import Idea
from support.models import SupportTicket, TicketMessage
from subscriptions.models import UserSubscription, SubscriptionPlan
from .serializers import (
    AdminUserSerializer,
    AdminIdeaSerializer,
    AdminTicketSerializer,
    AdminSubscriptionSerializer
)
from support.serializers import TicketMessageSerializer

User = get_user_model()

class IsSuperUserOrStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperUserOrStaff]
    
    @action(detail=True, methods=['post'])
    def ban(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'status': 'User banned'})
        
    @action(detail=True, methods=['post'])
    def unban(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'User unbanned'})
        
    @action(detail=True, methods=['post'])
    def give_subscription(self, request, pk=None):
        user = self.get_object()
        plan_slug = request.data.get('plan_slug')
        duration_days = int(request.data.get('duration_days', 30))
        
        try:
            plan = SubscriptionPlan.objects.get(slug=plan_slug)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=400)
            
        start_date = timezone.now()
        end_date = start_date + timedelta(days=duration_days)
        
        # Deactivate old subs
        UserSubscription.objects.filter(user=user, is_active=True).update(is_active=False)
        
        UserSubscription.objects.create(
            user=user,
            plan=plan,
            start_date=start_date,
            end_date=end_date,
            is_active=True,
            payment_amount=0 # Free give
        )
        
        return Response({'status': 'Subscription added'})

class AdminIdeaViewSet(viewsets.ModelViewSet):
    queryset = Idea.objects.all().order_by('-created_at')
    serializer_class = AdminIdeaSerializer
    permission_classes = [IsSuperUserOrStaff]
    
    # Standard CRUD is enough for delete/view
    # Filter backend can be added later

class AdminTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all().order_by('-created_at')
    serializer_class = AdminTicketSerializer
    permission_classes = [IsSuperUserOrStaff]
    
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'Content is required'}, status=400)
            
        message = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            content=content
        )
        
        ticket.status = SupportTicket.Status.ANSWERED
        ticket.save()
        
        serializer = TicketMessageSerializer(message, context={'request': request})
        return Response(serializer.data)
        
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = SupportTicket.Status.CLOSED
        ticket.save()
        return Response({'status': 'Ticket closed'})
