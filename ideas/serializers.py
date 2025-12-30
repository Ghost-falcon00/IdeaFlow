"""
Ideas Serializers - سریالایزرهای ایده‌ها
"""

from rest_framework import serializers
from .models import (
    Idea, Category, IdeaTag, IdeaCustomField, ChatSession, ChatMessage,
    Comment, IdeaStar, InvestmentRequest, InvestmentMessage, DuplicateReport
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']


class IdeaTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = IdeaTag
        fields = ['id', 'name']


class IdeaCustomFieldSerializer(serializers.ModelSerializer):
    """سریالایزر فیلدهای سفارشی"""
    
    class Meta:
        model = IdeaCustomField
        fields = ['id', 'name', 'field_type', 'value', 'options', 'order']
        read_only_fields = ['id']


class IdeaSerializer(serializers.ModelSerializer):
    """
    سریالایزر کامل ایده
    """
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    tags = IdeaTagSerializer(many=True, read_only=True)
    custom_fields = IdeaCustomFieldSerializer(many=True, read_only=True)
    remaining_scoring_attempts = serializers.SerializerMethodField()
    remaining_edit_attempts = serializers.SerializerMethodField()
    has_chat = serializers.SerializerMethodField()
    
    class Meta:
        model = Idea
        fields = [
            'id', 'user', 'user_name', 'title', 'description',
            'budget', 'execution_steps', 'required_skills', 'blocks',
            'category', 'category_name', 'tags', 'custom_fields',
            'ai_score', 'ai_feedback', 'similar_count',
            'scoring_count', 'edit_count',
            'remaining_scoring_attempts', 'remaining_edit_attempts',
            'visibility', 'is_public', 'has_chat', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'ai_score', 'ai_feedback', 'similar_count', 
                           'scoring_count', 'edit_count', 'created_at', 'updated_at']
    
    def get_remaining_scoring_attempts(self, obj):
        return max(0, obj.MAX_SCORING_ATTEMPTS - obj.scoring_count)
    
    def get_remaining_edit_attempts(self, obj):
        return max(0, obj.MAX_EDIT_ATTEMPTS - obj.edit_count)
    
    def get_has_chat(self, obj):
        return obj.chat_sessions.filter(is_active=True).exists()


class IdeaCreateSerializer(serializers.ModelSerializer):
    """
    سریالایزر ایجاد ایده جدید
    """
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        write_only=True
    )
    custom_fields = IdeaCustomFieldSerializer(many=True, required=False, write_only=True)
    
    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'description', 
            'budget', 'execution_steps', 'required_skills', 'blocks',
            'category', 'visibility', 'tags', 'custom_fields'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        custom_fields_data = validated_data.pop('custom_fields', [])
        
        idea = Idea.objects.create(**validated_data)
        
        # Create tags
        for tag_name in tags_data:
            IdeaTag.objects.create(idea=idea, name=tag_name)
        
        # Create custom fields
        for field_data in custom_fields_data:
            IdeaCustomField.objects.create(idea=idea, **field_data)
        
        return idea
    
    def to_representation(self, instance):
        """Return full idea data after creation"""
        return IdeaSerializer(instance).data


class IdeaListSerializer(serializers.ModelSerializer):
    """
    سریالایزر لیست ایده‌ها
    """
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    category = CategorySerializer(read_only=True)
    remaining_scoring_attempts = serializers.SerializerMethodField()
    has_chat = serializers.SerializerMethodField()
    
    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'description', 
            'budget', 'execution_steps', 'required_skills', 'blocks',
            'user_name', 'category',
            'ai_score', 'ai_feedback', 'similar_count',
            'scoring_count', 'remaining_scoring_attempts',
            'visibility', 'has_chat', 'created_at'
        ]
    
    def get_remaining_scoring_attempts(self, obj):
        return max(0, obj.MAX_SCORING_ATTEMPTS - obj.scoring_count)
    
    def get_has_chat(self, obj):
        return obj.chat_sessions.filter(is_active=True).exists()


# Chat Serializers

class ChatMessageSerializer(serializers.ModelSerializer):
    """سریالایزر پیام چت"""
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'created_at', 'suggested_action']
        read_only_fields = ['id', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    """سریالایزر جلسه چت"""
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ChatSession
        fields = ['id', 'idea', 'created_at', 'updated_at', 'is_active', 'message_count', 'messages']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChatSessionListSerializer(serializers.ModelSerializer):
    """سریالایزر لیست جلسات چت"""
    message_count = serializers.IntegerField(read_only=True)
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ['id', 'idea', 'created_at', 'updated_at', 'is_active', 'message_count', 'last_message']
    
    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return {
                'role': last.role,
                'content': last.content[:100] + '...' if len(last.content) > 100 else last.content
            }
        return None


class SendChatMessageSerializer(serializers.Serializer):
    """سریالایزر ارسال پیام چت"""
    message = serializers.CharField(max_length=2000)


# ========== Marketplace Serializers ==========

class CommentSerializer(serializers.ModelSerializer):
    """سریالایزر کامنت"""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_avatar = serializers.ImageField(source='user.profile_image', read_only=True)
    replies = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_avatar', 'parent',
            'content', 'created_at', 'is_edited', 'replies', 'replies_count'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'is_edited']
    
    def get_replies(self, obj):
        # Only get top-level replies
        if obj.parent is None:
            replies = obj.replies.all()[:5]  # Limit to 5 replies
            return CommentSerializer(replies, many=True).data
        return []
    
    def get_replies_count(self, obj):
        return obj.replies.count()


class IdeaStarSerializer(serializers.ModelSerializer):
    """سریالایزر ستاره"""
    
    class Meta:
        model = IdeaStar
        fields = ['id', 'idea', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class InvestmentMessageSerializer(serializers.ModelSerializer):
    """سریالایزر پیام مذاکره"""
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)
    
    class Meta:
        model = InvestmentMessage
        fields = ['id', 'sender', 'sender_name', 'content', 'created_at', 'is_read']
        read_only_fields = ['id', 'sender', 'created_at']


class InvestmentRequestSerializer(serializers.ModelSerializer):
    """سریالایزر درخواست سرمایه‌گذاری"""
    investor_name = serializers.CharField(source='investor.full_name', read_only=True)
    investor_email = serializers.CharField(source='investor.email', read_only=True)
    idea_title = serializers.CharField(source='idea.title', read_only=True)
    idea_owner = serializers.IntegerField(source='idea.user.id', read_only=True)
    idea_owner_name = serializers.CharField(source='idea.user.full_name', read_only=True)
    messages_count = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    proposed_amount = serializers.CharField(source='amount', read_only=True)
    proposed_equity = serializers.FloatField(source='share_percentage', read_only=True)
    
    class Meta:
        model = InvestmentRequest
        fields = [
            'id', 'idea', 'idea_title', 'idea_owner', 'idea_owner_name',
            'investor', 'investor_name', 'investor_email',
            'request_type', 'status', 'amount', 'share_percentage',
            'proposed_amount', 'proposed_equity',
            'message', 'messages_count', 'unread_count', 'last_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'idea', 'investor', 'status', 'created_at', 'updated_at']
    
    def get_messages_count(self, obj):
        return obj.messages.count()
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.messages.exclude(sender=request.user).filter(is_read=False).count()
        return 0
    
    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return last_msg.content[:50] + '...' if len(last_msg.content) > 50 else last_msg.content
        return None


class DuplicateReportSerializer(serializers.ModelSerializer):
    """سریالایزر گزارش تکراری"""
    reporter_name = serializers.CharField(source='reporter.full_name', read_only=True)
    reported_idea_title = serializers.CharField(source='reported_idea.title', read_only=True)
    original_idea_title = serializers.CharField(source='original_idea.title', read_only=True)
    
    class Meta:
        model = DuplicateReport
        fields = [
            'id', 'reported_idea', 'reported_idea_title',
            'original_idea', 'original_idea_title',
            'reporter', 'reporter_name', 'status',
            'ai_similarity_score', 'ai_analysis',
            'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'reporter', 'status', 'ai_similarity_score', 'ai_analysis', 'created_at', 'resolved_at']


# ========== Explore Serializers (Progressive Disclosure) ==========

class IdeaPublicPreviewSerializer(serializers.ModelSerializer):
    """
    سریالایزر پیش‌نمایش عمومی (سطح ۱ - همه می‌بینن)
    فقط اطلاعات کلی، بدون جزئیات اجرایی
    """
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    star_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_starred = serializers.SerializerMethodField()
    short_description = serializers.SerializerMethodField()
    
    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'short_description', 'user_name', 'category', 'category_name',
            'ai_score', 'star_count', 'comment_count', 'is_starred',
            'visibility', 'created_at'
        ]
    
    def get_star_count(self, obj):
        return obj.stars.count()
    
    def get_comment_count(self, obj):
        return obj.comments.count()
    
    def get_is_starred(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.stars.filter(user=request.user).exists()
        return False
    
    def get_short_description(self, obj):
        # فقط ۱۵۰ کاراکتر اول
        if len(obj.description) > 150:
            return obj.description[:150] + '...'
        return obj.description


class IdeaPublicDetailSerializer(serializers.ModelSerializer):
    """
    سریالایزر جزئیات عمومی (سطح ۲ - بعد از علاقه‌مندی)
    توضیحات بیشتر + بودجه
    """
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    star_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_starred = serializers.SerializerMethodField()
    my_investment_request = serializers.SerializerMethodField()
    
    class Meta:
        model = Idea
        fields = [
            'id', 'title', 'description', 'user_name', 'category', 'category_name',
            'budget', 'ai_score', 'ai_feedback',
            'star_count', 'comment_count', 'is_starred', 'my_investment_request',
            'visibility', 'created_at'
        ]
    
    def get_star_count(self, obj):
        return obj.stars.count()
    
    def get_comment_count(self, obj):
        return obj.comments.count()
    
    def get_is_starred(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.stars.filter(user=request.user).exists()
        return False
    
    def get_my_investment_request(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            req = obj.investment_requests.filter(investor=request.user).first()
            if req:
                return {
                    'id': req.id,
                    'status': req.status,
                    'type': req.request_type
                }
        return None
