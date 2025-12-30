"""
Management command to activate unlimited subscription for a user
Usage: python manage.py unlimited_sub user@email.com
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from subscriptions.models import SubscriptionPlan, UserSubscription

User = get_user_model()


class Command(BaseCommand):
    help = 'فعال‌سازی اشتراک نامحدود برای کاربر'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='ایمیل کاربر')

    def handle(self, *args, **options):
        email = options['email']
        
        # پیدا کردن کاربر
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f'❌ کاربر با ایمیل {email} پیدا نشد!'))
            return
        
        # ساخت یا گرفتن پلن نامحدود
        unlimited_plan, created = SubscriptionPlan.objects.get_or_create(
            slug='unlimited',
            defaults={
                'name': '♾️ نامحدود',
                'description': 'اشتراک نامحدود ویژه',
                'price': 0,
                'is_free': False,
                'ideas_per_day': 999999,
                'ai_chats_per_day': 999999,
                'ai_scoring_attempts': 999999,
                'custom_fields_per_idea': 999999,
                'is_active': True,
                'is_featured': True,
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✨ پلن نامحدود ساخته شد'))
        
        # حذف اشتراک قبلی
        UserSubscription.objects.filter(user=user).delete()
        
        # ساخت اشتراک جدید
        UserSubscription.objects.create(
            user=user,
            plan=unlimited_plan,
            expires_at=None  # بدون انقضا
        )
        
        self.stdout.write(self.style.SUCCESS(f'✅ اشتراک نامحدود برای {user.email} فعال شد!'))
        self.stdout.write(f'   📧 ایمیل: {user.email}')
        self.stdout.write(f'   👤 نام: {user.full_name}')
        self.stdout.write(f'   📦 پلن: {unlimited_plan.name}')
