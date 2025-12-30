"""
Support Views - ویوهای پشتیبانی
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SupportTicket, TicketMessage
from .serializers import SupportTicketSerializer, SupportTicketDetailSerializer, TicketMessageSerializer

class SupportTicketViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user).order_by('-updated_at')
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SupportTicketDetailSerializer
        return SupportTicketSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        
        # User can only reply if ticket is not closed (optional rule)
        # if ticket.status == SupportTicket.Status.CLOSED:
        #     return Response({'error': 'Tickt is closed'}, status=400)
            
        content = request.data.get('content')
        if not content:
            return Response({'error': 'Content is required'}, status=400)
            
        message = TicketMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            content=content,
            attachment=request.FILES.get('attachment')
        )
        
        # Re-open if closed? or Update status?
        if ticket.status == SupportTicket.Status.ANSWERED:
            ticket.status = SupportTicket.Status.OPEN
            ticket.save()
        else:
            ticket.save() # update updated_at
            
        serializer = TicketMessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
