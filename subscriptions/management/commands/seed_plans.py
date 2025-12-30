"""
Management command to seed subscription plans
"""

from django.core.management.base import BaseCommand
from subscriptions.models import SubscriptionPlan


class Command(BaseCommand):
    help = 'Seed subscription plans'

    def handle(self, *args, **options):
        # Delete existing plans
        SubscriptionPlan.objects.all().delete()
        
        # Create Free plan
        free = SubscriptionPlan.objects.create(
            name='رایگان',
            slug='free',
            description='شروع با امکانات پایه',
            price=0,
            is_free=True,
            ideas_per_day=3,
            ai_chats_per_day=5,
            ai_scoring_attempts=3,
            custom_fields_per_idea=3,
            is_active=True,
            order=1
        )
        self.stdout.write(self.style.SUCCESS(f'Created plan: {free.name}'))

        # Create Pro plan
        pro = SubscriptionPlan.objects.create(
            name='پرو',
            slug='pro',
            description='برای کارآفرینان جدی',
            price=99000,
            is_free=False,
            ideas_per_day=20,
            ai_chats_per_day=50,
            ai_scoring_attempts=10,
            custom_fields_per_idea=10,
            is_active=True,
            is_featured=True,
            order=2
        )
        self.stdout.write(self.style.SUCCESS(f'Created plan: {pro.name}'))

        # Create Enterprise plan
        enterprise = SubscriptionPlan.objects.create(
            name='سازمانی',
            slug='enterprise',
            description='نامحدود - برای تیم‌ها',
            price=299000,
            is_free=False,
            ideas_per_day=999,
            ai_chats_per_day=999,
            ai_scoring_attempts=999,
            custom_fields_per_idea=999,
            is_active=True,
            order=3
        )
        self.stdout.write(self.style.SUCCESS(f'Created plan: {enterprise.name}'))

        self.stdout.write(self.style.SUCCESS('All plans seeded successfully!'))
