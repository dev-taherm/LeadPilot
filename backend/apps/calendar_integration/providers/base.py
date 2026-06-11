from abc import ABC, abstractmethod


class CalendarProvider(ABC):
    @abstractmethod
    def check_availability(self, start_time, end_time):
        pass

    @abstractmethod
    def create_event(self, title, description, start_time, end_time, **kwargs):
        pass

    @abstractmethod
    def update_event(self, event_id, **kwargs):
        pass

    @abstractmethod
    def delete_event(self, event_id):
        pass
