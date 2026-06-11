from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CalendarEventViewSet, CalendarIntegrationViewSet

router = DefaultRouter()
router.register(r'integrations', CalendarIntegrationViewSet, basename='calendar-integration')
router.register(r'events', CalendarEventViewSet, basename='calendar-event')

urlpatterns = [
    path('', include(router.urls)),
]
