"""
Scoring Views - ویوهای امتیازدهی
"""

from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import UserScore, ScoreLog
from .serializers import (
    UserScoreSerializer,
    LeaderboardSerializer,
    ScoreLogSerializer,
)


class MyScoreView(generics.RetrieveAPIView):
    """
    امتیاز کاربر فعلی
    """
    serializer_class = UserScoreSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        score, _ = UserScore.objects.get_or_create(user=self.request.user)
        return score


class LeaderboardView(generics.ListAPIView):
    """
    رتبه‌بندی کاربران
    """
    serializer_class = LeaderboardSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        sort_by = self.request.query_params.get('sort', 'sum')
        
        queryset = UserScore.objects.select_related('user')
        
        if sort_by == 'avg':
            # Exclude users with few ideas to prevent skewing average (e.g. 1 idea with 100 score)
            return queryset.filter(ideas_count__gte=1).order_by('-avg_ai_score')[:50]
        else:
            return queryset.order_by('-sum_ai_score')[:50]


class MyScoreLogsView(generics.ListAPIView):
    """
    تاریخچه امتیازات کاربر فعلی
    """
    serializer_class = ScoreLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ScoreLog.objects.filter(user=self.request.user)[:20]


class UpdateRanksView(APIView):
    """
    بروزرسانی رتبه‌بندی کل کاربران
    (می‌تواند با Celery به صورت دوره‌ای اجرا شود)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Rank all users by total_score
        scores = UserScore.objects.order_by('-total_score')
        for rank, score in enumerate(scores, 1):
            score.rank = rank
            score.save(update_fields=['rank'])
        
        return Response({
            'message': f'رتبه‌بندی برای {scores.count()} کاربر بروزرسانی شد.'
        })
