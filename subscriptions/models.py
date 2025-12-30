"""
Subscriptions Models - مدل‌های اشتراک و پلن
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


class SubscriptionPlan(models.Model):
    """
    پلن‌های اشتراک
    """
    name = models.CharField(max_length=50, verbose_name='نام پلن')
    slug = models.SlugField(unique=True, allow_unicode=True)
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    # قیمت‌گذاری
    price = models.PositiveIntegerField(default=0, verbose_name='قیمت (تومان/ماه)')
    is_free = models.BooleanField(default=False, verbose_name='رایگان')
    
    # محدودیت‌ها
    ideas_per_day = models.PositiveIntegerField(
        default=3,
        verbose_name='تعداد ایده در روز'
    )
    ai_chats_per_day = models.PositiveIntegerField(
        default=5,
        verbose_name='تعداد پیام چت AI در روز'
    )
    ai_scoring_attempts = models.PositiveIntegerField(
        default=3,
        verbose_name='دفعات امتیازگیری هر ایده'
    )
    custom_fields_per_idea = models.PositiveIntegerField(
        default=3,
        verbose_name='تعداد فیلد سفارشی هر ایده'
    )
    
    # وضعیت
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    is_featured = models.BooleanField(default=False, verbose_name='ویژه')
    order = models.PositiveIntegerField(default=0, verbose_name='ترتیب نمایش')
    
    class Meta:
        verbose_name = 'پلن اشتراک'
        verbose_name_plural = 'پلن‌های اشتراک'
        ordering = ['order', 'price']
    
    def __str__(self):
        return self.name


class UserSubscription(models.Model):
    """
    اشتراک فعال کاربر
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription',
        verbose_name='کاربر'
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.SET_NULL,
        null=True,
        related_name='subscribers',
        verbose_name='پلن'
    )
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ شروع')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='تاریخ انقضا')
    
    class Meta:
        verbose_name = 'اشتراک کاربر'
        verbose_name_plural = 'اشتراک‌های کاربران'
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.name if self.plan else 'بدون پلن'}"
    
    @property
    def is_expired(self):
        if not self.expires_at:
            return False
        return timezone.now() > self.expires_at
    
    @property
    def is_active(self):
        return self.plan is not None and not self.is_expired


class UsageLog(models.Model):
    """
    لاگ مصرف روزانه کاربر
    """
    class UsageType(models.TextChoices):
        IDEA_CREATE = 'idea_create', 'ثبت ایده'
        AI_CHAT = 'ai_chat', 'چت با AI'
        AI_SCORE = 'ai_score', 'امتیازگیری AI'
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='usage_logs',
        verbose_name='کاربر'
    )
    usage_type = models.CharField(
        max_length=20,
        choices=UsageType.choices,
        verbose_name='نوع مصرف'
    )
    date = models.DateField(auto_now_add=True, verbose_name='تاریخ')
    count = models.PositiveIntegerField(default=1, verbose_name='تعداد')
    
    class Meta:
        verbose_name = 'لاگ مصرف'
        verbose_name_plural = 'لاگ‌های مصرف'
        unique_together = ['user', 'usage_type', 'date']
        indexes = [
            models.Index(fields=['user', 'date']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.get_usage_type_display()} - {self.date}"
