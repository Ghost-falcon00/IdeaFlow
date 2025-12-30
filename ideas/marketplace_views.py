"""
Marketplace Views - ویوهای مارکت‌پلیس ایده‌ها
"""

from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.db.models import Count, Q
from django.utils import timezone

from .models import (
    Idea, Comment, IdeaStar, InvestmentRequest, InvestmentMessage, DuplicateReport
)
from .serializers import (
    IdeaPublicPreviewSerializer, IdeaPublicDetailSerializer,
    CommentSerializer, IdeaStarSerializer,
    InvestmentRequestSerializer, InvestmentMessageSerializer,
    DuplicateReportSerializer
)


class ExploreViewSet(viewsets.ReadOnlyModelViewSet):
    """
    صفحه Explore - لیست ایده‌های عمومی
    با جستجو، فیلتر و مرتب‌سازی
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'tags__name']
    ordering_fields = ['created_at', 'ai_score']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Idea.objects.filter(
            visibility='public'
        ).select_related('user', 'category').annotate(
            star_count=Count('stars'),
            comment_count=Count('comments')
        )
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filter by min score
        min_score = self.request.query_params.get('min_score')
        if min_score:
            queryset = queryset.filter(ai_score__gte=min_score)
        
        # Sort by stars count
        sort = self.request.query_params.get('sort')
        if sort == 'popular':
            queryset = queryset.order_by('-star_count')
        elif sort == 'top_rated':
            queryset = queryset.order_by('-ai_score')
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return IdeaPublicDetailSerializer
        return IdeaPublicPreviewSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def star(self, request, pk=None):
        """ستاره دادن/برداشتن"""
        idea = self.get_object()
        
        # Check if already starred
        star = IdeaStar.objects.filter(idea=idea, user=request.user).first()
        if star:
            star.delete()
            return Response({
                'starred': False,
                'star_count': idea.stars.count()
            })
        else:
            IdeaStar.objects.create(idea=idea, user=request.user)
            return Response({
                'starred': True,
                'star_count': idea.stars.count()
            })
    
    @action(detail=True, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def comments(self, request, pk=None):
        """کامنت‌های ایده"""
        idea = self.get_object()
        
        if request.method == 'GET':
            # فقط کامنت‌های اصلی (نه ریپلای‌ها)
            comments = idea.comments.filter(parent=None).order_by('-created_at')[:50]
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            content = request.data.get('content')
            parent_id = request.data.get('parent_id')
            
            if not content:
                return Response({'error': 'محتوا الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
            
            parent = None
            if parent_id:
                parent = Comment.objects.filter(id=parent_id, idea=idea).first()
            
            comment = Comment.objects.create(
                idea=idea,
                user=request.user,
                parent=parent,
                content=content
            )
            return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def invest(self, request, pk=None):
        """درخواست سرمایه‌گذاری"""
        idea = self.get_object()
        
        # Check not own idea
        if idea.user == request.user:
            return Response({'error': 'نمی‌توانید روی ایده خودتان سرمایه‌گذاری کنید'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check existing request
        existing = InvestmentRequest.objects.filter(
            idea=idea, investor=request.user
        ).exclude(status__in=['rejected', 'completed']).first()
        if existing:
            return Response({
                'error': 'شما قبلاً درخواست فعال دارید',
                'request_id': existing.id
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = InvestmentRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        investment = InvestmentRequest.objects.create(
            idea=idea,
            investor=request.user,
            request_type=serializer.validated_data.get('request_type', 'investment'),
            amount=serializer.validated_data.get('amount', ''),
            share_percentage=serializer.validated_data.get('share_percentage'),
            message=serializer.validated_data.get('message', '')
        )
        
        return Response(InvestmentRequestSerializer(investment).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def report_duplicate(self, request, pk=None):
        """گزارش ایده تکراری"""
        reported_idea = self.get_object()
        original_idea_id = request.data.get('original_idea_id')
        
        if not original_idea_id:
            return Response({'error': 'شناسه ایده اصلی الزامی است'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            original_idea = Idea.objects.get(id=original_idea_id, visibility='public')
        except Idea.DoesNotExist:
            return Response({'error': 'ایده اصلی پیدا نشد'}, 
                          status=status.HTTP_404_NOT_FOUND)
        
        # Check original is older
        if original_idea.created_at >= reported_idea.created_at:
            return Response({
                'error': 'ایده اصلی باید قبل از ایده گزارش‌شده ثبت شده باشد'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create report
        report = DuplicateReport.objects.create(
            reported_idea=reported_idea,
            original_idea=original_idea,
            reporter=request.user
        )
        
        # TODO: Run AI comparison asynchronously
        
        return Response({
            'message': 'گزارش ثبت شد و در دست بررسی است',
            'report_id': report.id
        }, status=status.HTTP_201_CREATED)


class InvestmentRequestViewSet(viewsets.ModelViewSet):
    """
    مدیریت درخواست‌های سرمایه‌گذاری
    """
    permission_classes = [IsAuthenticated]
    serializer_class = InvestmentRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        # درخواست‌هایی که کاربر فرستاده یا دریافت کرده
        return InvestmentRequest.objects.filter(
            Q(investor=user) | Q(idea__user=user)
        ).select_related('idea', 'investor', 'idea__user')
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """پذیرش درخواست (توسط صاحب ایده)"""
        investment = self.get_object()
        
        if investment.idea.user != request.user:
            return Response({'error': 'فقط صاحب ایده می‌تواند تایید کند'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        investment.status = 'accepted'
        investment.save()
        return Response({'message': 'درخواست پذیرفته شد', 'status': investment.status})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """رد درخواست (توسط صاحب ایده)"""
        investment = self.get_object()
        
        if investment.idea.user != request.user:
            return Response({'error': 'فقط صاحب ایده می‌تواند رد کند'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        investment.status = 'rejected'
        investment.save()
        return Response({'message': 'درخواست رد شد', 'status': investment.status})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """نهایی کردن معامله (توسط صاحب ایده)"""
        investment = self.get_object()
        
        if investment.idea.user != request.user:
            return Response({'error': 'فقط صاحب ایده می‌تواند معامله را نهایی کند'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        if investment.status not in ['accepted', 'negotiation']:
            return Response({'error': 'وضعیت درخواست مناسب نیست'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        investment.status = 'completed'
        investment.save()
        
        # TODO: در اینجا می‌توان:
        # - انتقال مالکیت ایده (برای خرید کامل)
        # - ثبت تراکنش مالی
        # - ارسال نوتیفیکیشن
        
        return Response({
            'message': '🎉 معامله با موفقیت نهایی شد!', 
            'status': investment.status
        })
    
    @action(detail=True, methods=['get', 'post'])
    def messages(self, request, pk=None):
        """پیام‌های مذاکره"""
        investment = self.get_object()
        
        # Check access
        if request.user not in [investment.investor, investment.idea.user]:
            return Response({'error': 'دسترسی ندارید'}, status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'GET':
            # Mark as read
            investment.messages.exclude(sender=request.user).update(is_read=True)
            
            messages = investment.messages.all()
            serializer = InvestmentMessageSerializer(messages, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            content = request.data.get('content')
            if not content:
                return Response({'error': 'محتوا الزامی است'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update status to negotiation
            if investment.status == 'pending':
                investment.status = 'negotiation'
                investment.save()
            
            message = InvestmentMessage.objects.create(
                request=investment,
                sender=request.user,
                content=content
            )
            return Response(InvestmentMessageSerializer(message).data, status=status.HTTP_201_CREATED)


class CommentViewSet(viewsets.ModelViewSet):
    """
    مدیریت کامنت‌ها
    """
    permission_classes = [IsAuthenticated]
    serializer_class = CommentSerializer
    
    def get_queryset(self):
        return Comment.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(is_edited=True)
    
    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        if comment.user != request.user:
            return Response({'error': 'فقط نویسنده می‌تواند حذف کند'}, 
                          status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
