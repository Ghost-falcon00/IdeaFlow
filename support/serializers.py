from rest_framework import serializers
from .models import SupportTicket, TicketMessage

class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.profile_image', read_only=True)
    is_me = serializers.SerializerMethodField()
    
    class Meta:
        model = TicketMessage
        fields = ['id', 'sender', 'sender_name', 'sender_avatar', 'content', 'attachment', 'created_at', 'is_me']
        read_only_fields = ['id', 'sender', 'created_at']
        
    def get_is_me(self, obj):
        request = self.context.get('request')
        if request:
            return obj.sender == request.user
        return False

class SupportTicketSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = ['id', 'user', 'user_name', 'subject', 'status', 'priority', 'created_at', 'updated_at', 'last_message']
        read_only_fields = ['id', 'user', 'status', 'created_at', 'updated_at']
        
    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return TicketMessageSerializer(last, context=self.context).data
        return None

class SupportTicketDetailSerializer(SupportTicketSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    
    class Meta(SupportTicketSerializer.Meta):
        fields = SupportTicketSerializer.Meta.fields + ['messages']
