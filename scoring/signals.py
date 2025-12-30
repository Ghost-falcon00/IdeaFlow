from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from ideas.models import Idea
from .models import UserScore

@receiver(post_save, sender=Idea)
@receiver(post_delete, sender=Idea)
def update_user_score(sender, instance, **kwargs):
    """
    Update user score when an idea is saved or deleted.
    """
    user = instance.user
    if user:
        score, created = UserScore.objects.get_or_create(user=user)
        score.update_score()
