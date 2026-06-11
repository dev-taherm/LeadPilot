import uuid

from django.db import models


class AnalyticsSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='analytics_snapshots',
    )
    date = models.DateField()
    total_leads = models.IntegerField(default=0)
    new_leads = models.IntegerField(default=0)
    qualified_leads = models.IntegerField(default=0)
    meetings_booked = models.IntegerField(default=0)
    conversion_rate = models.FloatField(default=0.0)
    avg_response_time = models.FloatField(default=0.0)
    ai_interactions = models.IntegerField(default=0)
    active_conversations = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['business', 'date']

    def __str__(self):
        return f"Analytics {self.date} - {self.business.name}"
