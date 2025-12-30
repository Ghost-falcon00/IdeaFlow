from django.apps import AppConfig


class ScoringConfig(AppConfig):
    name = 'scoring'

    def ready(self):
        import scoring.signals
