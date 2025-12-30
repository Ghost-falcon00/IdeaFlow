"""
Subscriptions Services - سرویس‌های بررسی محدودیت‌ها
"""

from django.utils import timezone
from django.db.models import Sum
from .models import SubscriptionPlan, UserSubscription, UsageLog


class LimitService:
    """
    سرویس بررسی و مدیریت محدودیت‌های کاربر
    """
    
    # پلن پیش‌فرض رایگان
    DEFAULT_LIMITS = {
        'ideas_per_day': 3,
        'ai_chats_per_day': 5,
        'ai_scoring_attempts': 3,
        'custom_fields_per_idea': 3,
    }
    
    @classmethod
    def get_user_plan(cls, user):
        """دریافت پلن فعال کاربر"""
        try:
            subscription = user.subscription
            if subscription.is_active:
                return subscription.plan
        except UserSubscription.DoesNotExist:
            pass
        
        # اگر پلن ندارد، پلن رایگان پیش‌فرض
        free_plan = SubscriptionPlan.objects.filter(is_free=True, is_active=True).first()
        return free_plan
    
    @classmethod
    def get_limits(cls, user):
        """دریافت محدودیت‌های کاربر"""
        plan = cls.get_user_plan(user)
        
        if plan:
            return {
                'ideas_per_day': plan.ideas_per_day,
                'ai_chats_per_day': plan.ai_chats_per_day,
                'ai_scoring_attempts': plan.ai_scoring_attempts,
                'custom_fields_per_idea': plan.custom_fields_per_idea,
            }
        
        return cls.DEFAULT_LIMITS
    
    @classmethod
    def get_today_usage(cls, user, usage_type):
        """دریافت مصرف امروز"""
        today = timezone.now().date()
        
        try:
            log = UsageLog.objects.get(
                user=user,
                usage_type=usage_type,
                date=today
            )
            return log.count
        except UsageLog.DoesNotExist:
            return 0
    
    @classmethod
    def increment_usage(cls, user, usage_type):
        """افزایش مصرف"""
        today = timezone.now().date()
        
        log, created = UsageLog.objects.get_or_create(
            user=user,
            usage_type=usage_type,
            date=today,
            defaults={'count': 0}
        )
        log.count += 1
        log.save()
        return log.count
    
    @classmethod
    def can_create_idea(cls, user):
        """آیا کاربر می‌تواند ایده جدید ثبت کند؟"""
        limits = cls.get_limits(user)
        usage = cls.get_today_usage(user, UsageLog.UsageType.IDEA_CREATE)
        return usage < limits['ideas_per_day']
    
    @classmethod
    def can_chat_with_ai(cls, user):
        """آیا کاربر می‌تواند با AI چت کند؟"""
        limits = cls.get_limits(user)
        usage = cls.get_today_usage(user, UsageLog.UsageType.AI_CHAT)
        return usage < limits['ai_chats_per_day']
    
    @classmethod
    def get_remaining_limits(cls, user):
        """دریافت محدودیت‌های باقیمانده"""
        limits = cls.get_limits(user)
        
        idea_usage = cls.get_today_usage(user, UsageLog.UsageType.IDEA_CREATE)
        chat_usage = cls.get_today_usage(user, UsageLog.UsageType.AI_CHAT)
        
        return {
            'ideas_remaining': max(0, limits['ideas_per_day'] - idea_usage),
            'ideas_limit': limits['ideas_per_day'],
            'chats_remaining': max(0, limits['ai_chats_per_day'] - chat_usage),
            'chats_limit': limits['ai_chats_per_day'],
            'scoring_attempts': limits['ai_scoring_attempts'],
            'custom_fields_limit': limits['custom_fields_per_idea'],
        }


# شیء singleton برای استفاده آسان
limit_service = LimitService()
