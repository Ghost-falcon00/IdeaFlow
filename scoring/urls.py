"""
Scoring URLs - مسیرهای امتیازدهی
"""

from django.urls import path

from . import views

app_name = 'scoring'

urlpatterns = [
    path('my/', views.MyScoreView.as_view(), name='my_score'),
    path('leaderboard/', views.LeaderboardView.as_view(), name='leaderboard'),
    path('logs/', views.MyScoreLogsView.as_view(), name='score_logs'),
    path('update-ranks/', views.UpdateRanksView.as_view(), name='update_ranks'),
]
