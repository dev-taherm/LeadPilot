from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from apps.common.mixins import TenantAccessMixin
from apps.common.pagination import StandardResultsPagination
from apps.common.responses import (
    created_response,
    error_response,
    success_response,
)

from .models import Conversation, Message
from .serializers import (
    ConversationDetailSerializer,
    ConversationListSerializer,
    ConversationSerializer,
    MessageCreateSerializer,
    MessageSerializer,
)


class ConversationViewSet(TenantAccessMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    filterset_fields = ['status', 'channel', 'ai_paused']
    search_fields = ['lead__name', 'lead__email']
    ordering_fields = ['last_message_at', 'created_at', 'status']

    def get_queryset(self):
        return (
            Conversation.objects.select_related('lead', 'assigned_to')
            .prefetch_related('messages')
            .annotate(
                _unread_count=Count(
                    'messages',
                    filter=Q(messages__sender_type='lead'),
                )
            )
            .all()
        )

    def get_serializer_class(self):
        if self.action == 'list':
            return ConversationListSerializer
        if self.action == 'retrieve':
            return ConversationDetailSerializer
        return ConversationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        conversation = serializer.instance
        return created_response(
            ConversationSerializer(conversation).data,
            message='Conversation created successfully',
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            ConversationSerializer(serializer.instance).data,
            message='Conversation updated successfully',
        )

    @action(detail=True, methods=['post'], url_path='pause-ai')
    def pause_ai(self, request, pk=None):
        conversation = self.get_object()
        if conversation.ai_paused:
            return error_response(message='AI is already paused')
        conversation.ai_paused = True
        conversation.save(update_fields=['ai_paused', 'updated_at'])
        Message.objects.create(
            conversation=conversation,
            sender_type=Message.SenderType.SYSTEM,
            content='AI auto-responses paused by staff',
            channel=conversation.channel,
        )
        return success_response(
            ConversationSerializer(conversation).data,
            message='AI paused successfully',
        )

    @action(detail=True, methods=['post'], url_path='resume-ai')
    def resume_ai(self, request, pk=None):
        conversation = self.get_object()
        if not conversation.ai_paused:
            return error_response(message='AI is not paused')
        conversation.ai_paused = False
        conversation.save(update_fields=['ai_paused', 'updated_at'])
        Message.objects.create(
            conversation=conversation,
            sender_type=Message.SenderType.SYSTEM,
            content='AI auto-responses resumed by staff',
            channel=conversation.channel,
        )
        return success_response(
            ConversationSerializer(conversation).data,
            message='AI resumed successfully',
        )

    @action(detail=True, methods=['post'], url_path='handoff')
    def handoff(self, request, pk=None):
        conversation = self.get_object()
        conversation.status = Conversation.Status.AI_HANDOFF
        conversation.assigned_to = request.user
        conversation.ai_paused = True
        conversation.save(update_fields=['status', 'assigned_to', 'ai_paused', 'updated_at'])
        Message.objects.create(
            conversation=conversation,
            sender_type=Message.SenderType.SYSTEM,
            content=f'Conversation handed off to {request.user.get_full_name()}',
            channel=conversation.channel,
        )
        return success_response(
            ConversationSerializer(conversation).data,
            message='Handoff successful',
        )

    @action(detail=True, methods=['post'], url_path='close')
    def close(self, request, pk=None):
        conversation = self.get_object()
        conversation.status = Conversation.Status.CLOSED
        conversation.save(update_fields=['status', 'updated_at'])
        Message.objects.create(
            conversation=conversation,
            sender_type=Message.SenderType.SYSTEM,
            content='Conversation closed',
            channel=conversation.channel,
        )
        return success_response(
            ConversationSerializer(conversation).data,
            message='Conversation closed',
        )


class MessageViewSet(TenantAccessMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    ordering_fields = ['created_at']

    def get_queryset(self):
        conversation_pk = self.kwargs.get('conversation_pk')
        return (
            Message.objects.filter(
                conversation_id=conversation_pk,
                conversation__business=self.request.tenant,
            )
            .select_related('conversation')
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return MessageCreateSerializer
        return MessageSerializer

    def perform_create(self, serializer):
        conversation_pk = self.kwargs.get('conversation_pk')
        serializer.save(
            conversation_id=conversation_pk,
            sender_type=Message.SenderType.STAFF,
            sender_id=self.request.user.id,
        )
        Conversation.objects.filter(id=conversation_pk).update(
            last_message_at=timezone.now(),
        )

    def create(self, request, *args, **kwargs):
        conversation_pk = self.kwargs.get('conversation_pk')
        if not Conversation.objects.filter(
            id=conversation_pk, business=request.tenant
        ).exists():
            return error_response(message='Conversation not found', status_code=404)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        message = serializer.instance
        return created_response(
            MessageSerializer(message).data,
            message='Message sent successfully',
        )

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        message = self.get_object()
        message.metadata['read'] = True
        message.save(update_fields=['metadata'])
        return success_response(
            MessageSerializer(message).data,
            message='Message marked as read',
        )
