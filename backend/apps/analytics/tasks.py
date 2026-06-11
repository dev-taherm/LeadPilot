from celery import shared_task
from django.utils import timezone

from apps.leads.models import Lead
from apps.conversations.models import Conversation


@shared_task
def compute_analytics(business_id, date=None):
    if date is None:
        date = timezone.now().date()

    from apps.analytics.models import AnalyticsSnapshot

    leads_qs = Lead.objects.filter(business_id=business_id)
    total_leads = leads_qs.count()
    new_leads = leads_qs.filter(status=Lead.Status.NEW).count()
    qualified_leads = leads_qs.filter(status=Lead.Status.QUALIFIED).count()
    meetings_booked = leads_qs.filter(status=Lead.Status.MEETING_BOOKED).count()

    won = leads_qs.filter(status=Lead.Status.WON).count()
    total_outcomes = leads_qs.exclude(status=Lead.Status.NEW).count()
    conversion_rate = (won / total_outcomes * 100) if total_outcomes > 0 else 0.0

    try:
        conversations_qs = Conversation.objects.filter(business_id=business_id)
        active_conversations = conversations_qs.exclude(status='closed').count()
    except Exception:
        active_conversations = 0

    snapshot, _ = AnalyticsSnapshot.objects.update_or_create(
        business_id=business_id,
        date=date,
        defaults={
            'total_leads': total_leads,
            'new_leads': new_leads,
            'qualified_leads': qualified_leads,
            'meetings_booked': meetings_booked,
            'conversion_rate': conversion_rate,
            'avg_response_time': 0.0,
            'ai_interactions': 0,
            'active_conversations': active_conversations,
        },
    )
    return snapshot.id
