from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from apps.common.pagination import StandardResultsPagination
from apps.common.responses import (
    created_response,
    error_response,
    success_response,
)

from .models import Notification
from .serializers import NotificationListSerializer, NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'is_read']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = NotificationListSerializer(
                page, many=True, context={'request': request}
            )
            return self.get_paginated_response(serializer.data)
        serializer = NotificationListSerializer(
            qs, many=True, context={'request': request}
        )
        return success_response(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return success_response(
            NotificationSerializer(instance).data,
        )

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return success_response(
            NotificationSerializer(notification).data,
            message='Notification marked as read',
        )

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).update(is_read=True)
        return success_response(
            data={'updated_count': updated},
            message=f'{updated} notifications marked as read',
        )

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False,
        ).count()
        return success_response(data={'unread_count': count})
