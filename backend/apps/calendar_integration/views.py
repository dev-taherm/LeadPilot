from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from apps.common.mixins import TenantAccessMixin
from apps.common.pagination import StandardResultsPagination
from apps.common.responses import (
    created_response,
    error_response,
    no_content_response,
    success_response,
)

from .models import CalendarEvent, CalendarIntegration
from .providers.google import GoogleCalendarProvider
from .serializers import (
    CalendarEventCreateSerializer,
    CalendarEventSerializer,
    CalendarIntegrationSerializer,
)

PROVIDER_MAP = {
    'google': GoogleCalendarProvider,
}


class CalendarIntegrationViewSet(TenantAccessMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    search_fields = ['provider']
    ordering_fields = ['created_at', 'updated_at']

    def get_queryset(self):
        return CalendarIntegration.objects.all()

    def get_serializer_class(self):
        return CalendarIntegrationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return created_response(
            CalendarIntegrationSerializer(serializer.instance).data,
            message='Calendar integration created successfully',
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            CalendarIntegrationSerializer(serializer.instance).data,
            message='Calendar integration updated successfully',
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return no_content_response(message='Calendar integration deleted successfully')

    @action(detail=True, methods=['post'], url_path='test-connection')
    def test_connection(self, request, pk=None):
        instance = self.get_object()
        provider_class = PROVIDER_MAP.get(instance.provider)
        if not provider_class:
            return error_response(message='Provider not supported')
        provider = provider_class(credentials=instance.credentials)
        now = timezone.now()
        result = provider.check_availability(now, now)
        return success_response(
            data=result,
            message='Connection test successful',
        )


class CalendarEventViewSet(TenantAccessMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    search_fields = ['title', 'description']
    ordering_fields = ['start_time', 'end_time', 'created_at']

    def get_queryset(self):
        qs = CalendarEvent.objects.select_related('lead').all()
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if start:
            qs = qs.filter(start_time__gte=start)
        if end:
            qs = qs.filter(end_time__lte=end)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return CalendarEventCreateSerializer
        return CalendarEventSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save(business=request.tenant)

        integration = CalendarIntegration.objects.filter(
            business=request.tenant,
            is_active=True,
        ).first()

        if integration:
            provider_class = PROVIDER_MAP.get(integration.provider)
            if provider_class:
                provider = provider_class(credentials=integration.credentials)
                result = provider.create_event(
                    title=event.title,
                    description=event.description,
                    start_time=event.start_time,
                    end_time=event.end_time,
                )
                event.external_id = result.get('external_id', '')
                event.save(update_fields=['external_id', 'updated_at'])

        return created_response(
            CalendarEventSerializer(event).data,
            message='Event created successfully',
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()

        if event.external_id and event.status != old_status:
            integration = CalendarIntegration.objects.filter(
                business=request.tenant,
                is_active=True,
            ).first()
            if integration:
                provider_class = PROVIDER_MAP.get(integration.provider)
                if provider_class:
                    provider = provider_class(credentials=integration.credentials)
                    if event.status == 'cancelled':
                        provider.delete_event(event.external_id)
                    else:
                        provider.update_event(
                            event.external_id,
                            title=event.title,
                            description=event.description,
                            start_time=event.start_time,
                            end_time=event.end_time,
                        )

        return success_response(
            CalendarEventSerializer(event).data,
            message='Event updated successfully',
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return no_content_response(message='Event deleted successfully')
