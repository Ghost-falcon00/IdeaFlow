"""
Scoring Models - مدل‌های امتیازدهی
"""

from django.db import models
from django.conf import settings


class UserScore(models.Model):
    """
    امتیاز کلی هر کاربر برای رتبه‌بندی
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='score',
        verbose_name='کاربر'
    )
    
    # Score components
    total_score = models.PositiveIntegerField(
        default=0,
        verbose_name='امتیاز کل'
    )
    ideas_count = models.PositiveIntegerField(
        default=0,
        verbose_name='تعداد ایده‌ها'
    )
    avg_ai_score = models.FloatField(
        default=0,
        verbose_name='میانگین امتیاز AI'
    )
    sum_ai_score = models.PositiveIntegerField(
        default=0,
        verbose_name='مجموع امتیاز AI'
    )
    
    # Ranking
    rank = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name='رتبه'
    )
    
    # Timestamps
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'امتیاز کاربر'
        verbose_name_plural = 'امتیازات کاربران'
        ordering = ['-sum_ai_score']
        indexes = [
            models.Index(fields=['-sum_ai_score']),
            models.Index(fields=['-avg_ai_score']),
            models.Index(fields=['rank']),
        ]
    
    def __str__(self):
        return f"{self.user.email}: {self.sum_ai_score} امتیاز"
    
    def update_score(self):
        """
        محاسبه مجدد امتیاز کاربر بر اساس ایده‌ها
        """
        from ideas.models import Idea
        
        ideas = self.user.ideas.all()
        self.ideas_count = ideas.count()
        
        # Calculate scores
        scored_ideas = ideas.exclude(ai_score__isnull=True)
        if scored_ideas.exists():
            data = scored_ideas.aggregate(
                avg=models.Avg('ai_score'),
                sum=models.Sum('ai_score')
            )
            self.avg_ai_score = data['avg'] or 0
            self.sum_ai_score = data['sum'] or 0
        else:
            self.avg_ai_score = 0
            self.sum_ai_score = 0
        
        # Total score can be redundant if we have sum_ai_score, 
        # but let's keep it as sum for now to maintain compatibility if used elsewhere
        self.total_score = self.sum_ai_score
        self.save()


class ScoreLog(models.Model):
    """
    لاگ تغییرات امتیاز (برای رهگیری و تحلیل)
    """
    
    class ActionChoices(models.TextChoices):
        IDEA_CREATED = 'idea_created', 'ایده جدید ثبت شد'
        IDEA_DELETED = 'idea_deleted', 'ایده حذف شد'
        AI_SCORED = 'ai_scored', 'امتیاز AI دریافت شد'
        BONUS = 'bonus', 'امتیاز اضافی'
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='score_logs',
        verbose_name='کاربر'
    )
    action = models.CharField(
        max_length=20,
        choices=ActionChoices.choices,
        verbose_name='عملیات'
    )
    points_change = models.IntegerField(
        verbose_name='تغییر امتیاز'
    )
    description = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='توضیحات'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ'
    )
    
    class Meta:
        verbose_name = 'لاگ امتیاز'
        verbose_name_plural = 'لاگ‌های امتیاز'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email}: {self.points_change:+d} ({self.action})"
