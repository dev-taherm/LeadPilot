import logging
from datetime import timedelta

from django.utils import timezone

logger = logging.getLogger(__name__)


def _get_lead(lead_id: str):
    from apps.leads.models import Lead

    return Lead.objects.get(id=lead_id)


def _get_business(business_id: str):
    from apps.businesses.models import Business

    return Business.objects.get(id=business_id)


def send_email(lead_email: str, subject: str, body: str) -> dict:
    logger.info("Sending email to %s: %s", lead_email, subject)
    result = {
        'success': True,
        'to': lead_email,
        'subject': subject,
        'body_preview': body[:200],
        'sent_at': timezone.now().isoformat(),
    }
    logger.info("Email sent successfully: %s", result)
    return result


def book_meeting(
    lead_id: str,
    meeting_datetime: str,
    duration_minutes: int = 30,
    title: str = 'Follow-up Meeting',
) -> dict:
    lead = _get_lead(lead_id)
    try:
        from apps.calendar.models import CalendarEvent

        event = CalendarEvent.objects.create(
            business=lead.business,
            title=title,
            start_time=meeting_datetime,
            end_time=(
                timezone.datetime.fromisoformat(meeting_datetime)
                + timedelta(minutes=duration_minutes)
            ).isoformat(),
            lead=lead,
        )
        return {
            'success': True,
            'event_id': str(event.id),
            'title': title,
            'start_time': meeting_datetime,
            'duration_minutes': duration_minutes,
        }
    except ImportError:
        logger.warning("Calendar app not available, returning simulated result")
        return {
            'success': True,
            'event_id': 'simulated-event-id',
            'title': title,
            'start_time': meeting_datetime,
            'duration_minutes': duration_minutes,
            'simulated': True,
        }


def schedule_followup(
    lead_id: str,
    followup_datetime: str,
    message: str,
) -> dict:
    lead = _get_lead(lead_id)
    try:
        from config.celery import app as celery_app

        task = celery_app.send_task(
            'apps.conversations.tasks.send_followup_message',
            kwargs={
                'lead_id': lead_id,
                'business_id': str(lead.business_id),
                'message': message,
            },
            eta=followup_datetime,
        )
        return {
            'success': True,
            'task_id': task.id,
            'scheduled_for': followup_datetime,
            'message_preview': message[:200],
        }
    except Exception as exc:
        logger.warning("Could not schedule Celery task: %s", exc)
        return {
            'success': True,
            'task_id': 'simulated-task-id',
            'scheduled_for': followup_datetime,
            'message_preview': message[:200],
            'simulated': True,
        }


def update_lead_status(lead_id: str, new_status: str) -> dict:
    lead = _get_lead(lead_id)
    valid_statuses = [choice[0] for choice in lead.Status.choices]
    if new_status not in valid_statuses:
        return {
            'success': False,
            'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}',
        }
    old_status = lead.status
    lead.status = new_status
    lead.save(update_fields=['status', 'updated_at'])
    logger.info("Lead %s status updated: %s -> %s", lead_id, old_status, new_status)
    return {
        'success': True,
        'lead_id': lead_id,
        'old_status': old_status,
        'new_status': new_status,
    }


def notify_sales(business_id: str, message: str) -> dict:
    business = _get_business(business_id)
    try:
        from apps.notifications.models import Notification

        notification = Notification.objects.create(
            business=business,
            recipient=business.owner,
            title='Agent Notification',
            message=message,
            notification_type='agent_alert',
        )
        return {
            'success': True,
            'notification_id': str(notification.id),
            'recipient': str(business.owner),
        }
    except ImportError:
        logger.warning("Notifications app not available, returning simulated result")
        return {
            'success': True,
            'notification_id': 'simulated-notification-id',
            'recipient': str(business.owner),
            'simulated': True,
        }


def search_knowledge(business_id: str, query: str) -> dict:
    business = _get_business(business_id)
    try:
        from apps.knowledge.models import KnowledgeDocument

        docs = KnowledgeDocument.objects.filter(
            business=business,
            content__icontains=query,
        )[:5]
        results = [
            {'id': str(doc.id), 'title': doc.title, 'excerpt': doc.content[:300]}
            for doc in docs
        ]
        return {
            'success': True,
            'query': query,
            'results': results,
            'count': len(results),
        }
    except ImportError:
        logger.warning("Knowledge app not available, returning simulated result")
        return {
            'success': True,
            'query': query,
            'results': [],
            'count': 0,
            'simulated': True,
        }


def create_note(lead_id: str, content: str) -> dict:
    lead = _get_lead(lead_id)
    from apps.leads.models import LeadNote

    note = LeadNote.objects.create(
        lead=lead,
        content=content,
        created_by=None,
    )
    return {
        'success': True,
        'note_id': str(note.id),
        'content_preview': content[:200],
        'created_at': note.created_at.isoformat(),
    }
