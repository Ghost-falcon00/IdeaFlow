"""
Ideas Views - ویوهای ایده‌ها
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from .models import Idea, Category, ChatSession, ChatMessage, IdeaCustomField
from .serializers import (
    IdeaSerializer,
    IdeaCreateSerializer,
    IdeaListSerializer,
    CategorySerializer,
    ChatSessionSerializer,
    ChatSessionListSerializer,
    ChatMessageSerializer,
    SendChatMessageSerializer,
    IdeaCustomFieldSerializer,
)
from subscriptions.services import LimitService
from subscriptions.models import UsageLog


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    دسته‌بندی‌ها (فقط خواندنی)
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class IdeaViewSet(viewsets.ModelViewSet):
    """
    CRUD ایده‌ها
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if self.action == 'list':
            # Show public ideas or user's own ideas
            return Idea.objects.filter(
                visibility='public'
            ).select_related('user', 'category')
        return Idea.objects.filter(user=user).select_related('category')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return IdeaCreateSerializer
        if self.action == 'list':
            return IdeaListSerializer
        return IdeaSerializer
    
    def create(self, request, *args, **kwargs):
        # Check daily limit
        if not LimitService.can_create_idea(request.user):
            limits = LimitService.get_remaining_limits(request.user)
            return Response({
                'error': 'محدودیت روزانه',
                'message': f'شما به محدودیت ایده روزانه ({limits["ideas_limit"]} ایده) رسیده‌اید. فردا دوباره تلاش کنید یا پلن خود را ارتقا دهید.',
                'upgrade_url': '/plans'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        # Save idea and increment usage
        idea = serializer.save(user=self.request.user)
        LimitService.increment_usage(self.request.user, UsageLog.UsageType.IDEA_CREATE)

    def perform_update(self, serializer):
        idea = self.get_object()
        
        # Check edit limit
        if idea.edit_count >= idea.MAX_EDIT_ATTEMPTS:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'error': f'شما به سقف {idea.MAX_EDIT_ATTEMPTS} بار ویرایش رسیده‌اید.'
            })

        # Save updates
        updated_idea = serializer.save()
        
        # Increment edit count
        updated_idea.edit_count += 1
        updated_idea.save()
    
    @action(detail=False, methods=['get'])
    def my(self, request):
        """
        ایده‌های کاربر فعلی
        """
        ideas = Idea.objects.filter(user=request.user).select_related('category')
        serializer = IdeaListSerializer(ideas, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def ai_score(self, request, pk=None):
        """
        دریافت امتیاز AI برای ایده با Groq
        محدودیت: حداکثر 3 بار امتیازگیری
        """
        idea = self.get_object()
        
        # Check scoring limit
        if idea.scoring_count >= idea.MAX_SCORING_ATTEMPTS:
            return Response({
                'error': f'شما فقط {idea.MAX_SCORING_ATTEMPTS} بار می‌توانید امتیازگیری کنید',
                'remaining_attempts': 0
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if edited since last score (for re-scoring)
        if idea.scoring_count > 0 and idea.last_scored_description:
            # Simple text comparison (can be improved)
            if idea.description.strip() == idea.last_scored_description.strip():
                return Response({
                    'error': 'برای امتیازگیری مجدد باید ایده را ویرایش کنید و تغییرات معناداری ایجاد کنید.',
                    'remaining_attempts': idea.MAX_SCORING_ATTEMPTS - idea.scoring_count
                }, status=status.HTTP_400_BAD_REQUEST)

        # Import AI service
        from scoring.ai_service import idea_analyzer
        
        # Get category name
        category_name = idea.category.name if idea.category else None
        
        # Get blocks data if available
        blocks_data = idea.blocks if hasattr(idea, 'blocks') and idea.blocks else None
        
        # Analyze idea with AI (including blocks and advanced fields)
        result = idea_analyzer.analyze_idea(
            title=idea.title,
            description=idea.description,
            category=category_name,
            previous_description=idea.last_scored_description if idea.scoring_count > 0 else None,
            previous_score=idea.ai_score if idea.scoring_count > 0 else None,
            blocks=blocks_data,
            budget=idea.budget if hasattr(idea, 'budget') else None,
            execution_steps=idea.execution_steps if hasattr(idea, 'execution_steps') else None,
            required_skills=idea.required_skills if hasattr(idea, 'required_skills') else None
        )
        
        # Check for errors
        if 'error' in result:
            return Response({
                'error': result['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Save scores to idea
        idea.ai_score = result.get('total_score', 0)
        
        # Save current description as last scored
        idea.last_scored_description = idea.description
        
        # Create detailed feedback
        feedback_parts = []
        
        # Summary
        if result.get('summary'):
            feedback_parts.append(f"📝 {result['summary']}")
        
        # Verdict
        verdict_map = {
            'عالی': '🏆',
            'خوب': '👍',
            'متوسط': '👌',
            'نیاز به بهبود': '📈',
            'ضعیف': '⚠️'
        }
        verdict = result.get('verdict', '')
        if verdict:
            emoji = verdict_map.get(verdict, '📊')
            feedback_parts.append(f"\n{emoji} **ارزیابی کلی:** {verdict}")
        
        # Scores breakdown
        scores = result.get('scores', {})
        if scores:
            feedback_parts.append("\n\n📊 **امتیازات تفکیکی:**")
            score_labels = {
                'innovation': 'نوآوری',
                'feasibility': 'امکان‌پذیری',
                'market_potential': 'پتانسیل بازار',
                'impact': 'تأثیرگذاری',
                'competitive_advantage': 'مزیت رقابتی'
            }
            for key, label in score_labels.items():
                if key in scores:
                    feedback_parts.append(f"• {label}: {scores[key]}/20")
        
        # Strengths
        feedback = result.get('feedback', {})
        if feedback.get('strengths'):
            feedback_parts.append("\n\n✅ **نقاط قوت:**")
            for s in feedback['strengths']:
                feedback_parts.append(f"• {s}")
        
        # Weaknesses
        if feedback.get('weaknesses'):
            feedback_parts.append("\n\n⚠️ **نقاط ضعف:**")
            for w in feedback['weaknesses']:
                feedback_parts.append(f"• {w}")
        
        # Suggestions
        if feedback.get('suggestions'):
            feedback_parts.append("\n\n💡 **پیشنهادات:**")
            for sg in feedback['suggestions']:
                feedback_parts.append(f"• {sg}")
        
        idea.ai_feedback = '\n'.join(feedback_parts)
        
        # Increment scoring count
        idea.scoring_count += 1
        idea.save()
        
        # Update user score
        from scoring.models import UserScore
        user_score, _ = UserScore.objects.get_or_create(user=idea.user)
        user_score.update_score()
        
        remaining = idea.MAX_SCORING_ATTEMPTS - idea.scoring_count
        
        return Response({
            'ai_score': idea.ai_score,
            'ai_feedback': idea.ai_feedback,
            'scores': result.get('scores', {}),
            'verdict': result.get('verdict', ''),
            'scoring_count': idea.scoring_count,
            'remaining_attempts': remaining,
            'message': f'امتیاز AI محاسبه شد. ({remaining} بار دیگر باقی مانده)'
        })
    
    @action(detail=True, methods=['get'])
    def similar(self, request, pk=None):
        """
        ایده‌های مشابه
        (در آینده با الگوریتم مقایسه متنی پیاده‌سازی می‌شود)
        """
        idea = self.get_object()
        
        # TODO: پیاده‌سازی الگوریتم همخوانی متنی
        similar_ideas = Idea.objects.filter(
            visibility='public'
        ).exclude(id=idea.id)[:5]
        
        idea.similar_count = similar_ideas.count()
        idea.save()
        
        serializer = IdeaListSerializer(similar_ideas, many=True)
        return Response({
            'count': similar_ideas.count(),
            'ideas': serializer.data
        })
    
    # ========== Chat Actions ==========
    
    @action(detail=True, methods=['get', 'post'], url_path='chat')
    def chat(self, request, pk=None):
        """
        دریافت یا شروع چت برای ایده
        GET: دریافت جلسه فعال
        POST: ارسال پیام جدید
        """
        idea = self.get_object()
        
        if request.method == 'GET':
            # Get or create active session
            session, created = ChatSession.objects.get_or_create(
                idea=idea,
                is_active=True
            )
            serializer = ChatSessionSerializer(session)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = SendChatMessageSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            user_message = serializer.validated_data['message']
            
            # Check chat limit
            from subscriptions.services import LimitService
            if not LimitService.can_chat_with_ai(request.user):
                return Response({
                    'error': 'شما به سقف پیام‌های روزانه رسیده‌اید. برای ادامه، پلن خود را ارتقا دهید.',
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Get or create session
            session, _ = ChatSession.objects.get_or_create(
                idea=idea,
                is_active=True
            )
            
            # Save user message
            ChatMessage.objects.create(
                session=session,
                role='user',
                content=user_message
            )
            
            # Get chat history
            history = list(session.messages.values('role', 'content'))
            
            # Call AI advisor
            from scoring.chat_advisor import chat_advisor
            result = chat_advisor.chat(idea, history[:-1], user_message)
            
            # Save AI response
            ai_message = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content=result.get('content', ''),
                suggested_action=result.get('suggested_action')
            )
            
            # Increment usage
            from subscriptions.models import UsageLog
            LimitService.increment_usage(request.user, UsageLog.UsageType.AI_CHAT)
            
            # Return updated session
            return Response({
                'message': ChatMessageSerializer(ai_message).data,
                'session_id': session.id,
            })
    
    @action(detail=True, methods=['get'], url_path='chat/history')
    def chat_history(self, request, pk=None):
        """
        تاریخچه همه جلسات چت
        """
        idea = self.get_object()
        sessions = idea.chat_sessions.all()
        serializer = ChatSessionListSerializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='chat/apply-action')
    def apply_chat_action(self, request, pk=None):
        """
        اجرای اکشن پیشنهادی AI
        POST: {"action": {...}}
        """
        idea = self.get_object()
        
        # Check ownership
        if idea.user != request.user:
            return Response({
                'error': 'شما مجاز به این عملیات نیستید'
            }, status=status.HTTP_403_FORBIDDEN)
        
        action_data = request.data.get('action')
        if not action_data or not isinstance(action_data, dict):
            return Response({
                'error': 'اکشن نامعتبر'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Apply action
        from scoring.chat_advisor import chat_advisor
        result = chat_advisor.apply_action(idea, action_data)
        
        if result.get('success'):
            # Refresh idea data
            idea.refresh_from_db()
            return Response({
                'success': True,
                'message': result.get('message'),
                'idea': IdeaSerializer(idea).data
            })
        else:
            return Response({
                'success': False,
                'error': result.get('message', 'خطا در اعمال تغییرات')
            }, status=status.HTTP_400_BAD_REQUEST)
    
    # ========== Custom Fields Actions ==========
    
    @action(detail=True, methods=['get', 'post'], url_path='custom-fields')
    def custom_fields(self, request, pk=None):
        """
        مدیریت فیلدهای سفارشی
        GET: لیست فیلدها
        POST: افزودن فیلد جدید
        """
        idea = self.get_object()
        
        if request.method == 'GET':
            fields = idea.custom_fields.all()
            serializer = IdeaCustomFieldSerializer(fields, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Check limit
            from subscriptions.services import LimitService
            limits = LimitService.get_limits(request.user)
            current_count = idea.custom_fields.count()
            
            if current_count >= limits['custom_fields_per_idea']:
                return Response({
                    'error': f'شما فقط {limits["custom_fields_per_idea"]} فیلد سفارشی می‌توانید اضافه کنید.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = IdeaCustomFieldSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(idea=idea, order=current_count)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch', 'delete'], url_path='custom-fields/(?P<field_id>[0-9]+)')
    def custom_field_detail(self, request, pk=None, field_id=None):
        """
        ویرایش یا حذف فیلد سفارشی
        """
        idea = self.get_object()
        
        try:
            field = idea.custom_fields.get(id=field_id)
        except IdeaCustomField.DoesNotExist:
            return Response({
                'error': 'فیلد پیدا نشد'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'PATCH':
            serializer = IdeaCustomFieldSerializer(field, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        elif request.method == 'DELETE':
            field.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

