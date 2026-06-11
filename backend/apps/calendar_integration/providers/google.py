from .base import CalendarProvider


class GoogleCalendarProvider(CalendarProvider):
    def __init__(self, credentials=None):
        self.credentials = credentials or {}

    def check_availability(self, start_time, end_time):
        return {
            'available': True,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
        }

    def create_event(self, title, description, start_time, end_time, **kwargs):
        return {
            'external_id': f'google-event-{hash(title)}',
            'title': title,
            'description': description,
            'start_time': start_time.isoformat(),
            'end_time': end_time.isoformat(),
            'status': 'scheduled',
        }

    def update_event(self, event_id, **kwargs):
        return {
            'external_id': event_id,
            'updated': True,
            **kwargs,
        }

    def delete_event(self, event_id):
        return {
            'external_id': event_id,
            'deleted': True,
        }
