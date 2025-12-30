from django.core.management.base import BaseCommand
from scoring.models import UserScore
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Recalculates scores for all users'

    def handle(self, *args, **options):
        users = User.objects.all()
        count = 0
        
        for user in users:
            # Ensure UserScore exists
            score, created = UserScore.objects.get_or_create(user=user)
            score.update_score()
            count += 1
            if count % 10 == 0:
                self.stdout.write(f'Updated {count} users...')
                
        self.stdout.write(self.style.SUCCESS(f'Successfully updated scores for {count} users'))
