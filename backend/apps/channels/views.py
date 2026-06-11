import json
import logging
import secrets

from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.common.mixins import TenantAccessMixin
from apps.common.pagination import StandardResultsPagination
from apps.common.responses import created_response, error_response, success_response

from .adapters import get_adapter
from .models import ChannelIntegration
from .serializers import ChannelIntegrationSerializer

logger = logging.getLogger(__name__)


class ChannelIntegrationViewSet(TenantAccessMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    serializer_class = ChannelIntegrationSerializer
    ordering_fields = ['created_at', 'channel_type', 'status']

    def get_queryset(self):
        return ChannelIntegration.objects.filter(
            business=self.request.tenant,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(business=request.tenant)
        return created_response(
            ChannelIntegrationSerializer(serializer.instance).data,
            message='Channel integration created',
        )

    @action(detail=True, methods=['post'], url_path='test-connection')
    def test_connection(self, request, pk=None):
        integration = self.get_object()
        try:
            adapter = get_adapter(integration)
            result = adapter.health_check()
            if result['status'] == 'ok':
                integration.status = ChannelIntegration.Status.CONNECTED
                integration.last_error = ''
                integration.last_connected_at = timezone.now()
                integration.save(update_fields=['status', 'last_error', 'last_connected_at', 'updated_at'])
                return success_response(data=result, message=result['message'])
            integration.status = ChannelIntegration.Status.ERROR
            integration.last_error = result.get('message', '')
            integration.save(update_fields=['status', 'last_error', 'updated_at'])
            return error_response(message=result.get('message', 'Connection failed'), status_code=400)
        except Exception as e:
            integration.status = ChannelIntegration.Status.ERROR
            integration.last_error = str(e)
            integration.save(update_fields=['status', 'last_error', 'updated_at'])
            return error_response(message=str(e), status_code=500)

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle_active(self, request, pk=None):
        integration = self.get_object()
        integration.is_active = not integration.is_active
        integration.save(update_fields=['is_active', 'updated_at'])
        status_text = 'activated' if integration.is_active else 'deactivated'
        return success_response(
            ChannelIntegrationSerializer(integration).data,
            message=f'Channel {status_text}',
        )


class ChannelWebhookView(APIView):
    permission_classes = []

    def get(self, request, channel_type, integration_id):
        try:
            integration = ChannelIntegration.objects.get(
                id=integration_id,
                channel_type=channel_type,
                is_active=True,
            )
        except ChannelIntegration.DoesNotExist:
            return HttpResponse('Not found', status=404)

        adapter = get_adapter(integration)

        if channel_type in ('whatsapp', 'instagram', 'facebook'):
            mode = request.GET.get('hub.mode')
            token = request.GET.get('hub.verify_token')
            challenge = request.GET.get('hub.challenge')
            expected_token = integration.config.get('verify_token', '')
            if mode == 'subscribe' and token == expected_token:
                return HttpResponse(challenge)
            return HttpResponse('Forbidden', status=403)

        return HttpResponse('OK')

    def post(self, request, channel_type, integration_id):
        try:
            integration = ChannelIntegration.objects.get(
                id=integration_id,
                channel_type=channel_type,
                is_active=True,
            )
        except ChannelIntegration.DoesNotExist:
            return JsonResponse({'error': 'Not found'}, status=404)

        adapter = get_adapter(integration)

        if not adapter.verify_webhook(request):
            return JsonResponse({'error': 'Unauthorized'}, status=403)

        if channel_type == 'slack':
            try:
                import json
                body = json.loads(request.body)
                if body.get('type') == 'url_verification':
                    return JsonResponse({'challenge': body.get('challenge', '')})
            except Exception:
                pass

        parsed = adapter.parse_incoming(request)
        if not parsed:
            return JsonResponse({'status': 'ignored'})

        try:
            self._process_message(integration, parsed)
        except Exception as e:
            logger.exception("Error processing incoming message: %s", e)

        return JsonResponse({'status': 'ok'})

    def _process_message(self, integration, parsed):
        from apps.conversations.models import Conversation, Message
        from apps.leads.models import Lead

        business = integration.business
        sender_id = parsed['sender_id']
        content = parsed['content']
        channel_type = integration.channel_type

        channel_map = {
            'whatsapp': 'whatsapp',
            'telegram': 'sms',
            'sms': 'sms',
            'email': 'email',
            'slack': 'other',
            'discord': 'other',
            'instagram': 'other',
            'facebook': 'other',
        }

        lead, _ = Lead.objects.get_or_create(
            business=business,
            email=f'{sender_id}@{channel_type}.leadflow',
            defaults={
                'name': parsed.get('sender_name', sender_id),
                'source': 'other',
                'status': 'new',
            },
        )

        conversation, _ = Conversation.objects.get_or_create(
            lead=lead,
            business=business,
            channel=channel_map.get(channel_type, 'other'),
            defaults={'status': 'active'},
        )

        Message.objects.create(
            conversation=conversation,
            sender_type=Message.SenderType.LEAD,
            sender_id=None,
            content=content,
            channel=channel_map.get(channel_type, 'other'),
            metadata=parsed.get('metadata', {}),
        )

        Conversation.objects.filter(id=conversation.id).update(
            last_message_at=timezone.now(),
        )

        if not conversation.ai_paused:
            try:
                from apps.agent.agent import AgentRunner
                runner = AgentRunner(lead=lead, business=business, conversation=conversation)
                result = runner.run()
                if result.get('status') == 'completed':
                    tool_output = result.get('tool_output', {})
                    if tool_output.get('tool') == 'send_email':
                        Message.objects.create(
                            conversation=conversation,
                            sender_type=Message.SenderType.AI,
                            content=tool_output.get('body', ''),
                            channel=conversation.channel,
                            is_ai_generated=True,
                        )
                    elif tool_output.get('response'):
                        Message.objects.create(
                            conversation=conversation,
                            sender_type=Message.SenderType.AI,
                            content=tool_output['response'],
                            channel=conversation.channel,
                            is_ai_generated=True,
                        )
            except Exception as e:
                logger.warning("Agent failed for incoming message: %s", e)


class ChannelWebhookURLView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, integration_id):
        try:
            integration = ChannelIntegration.objects.get(
                id=integration_id,
                business=request.tenant,
            )
        except ChannelIntegration.DoesNotExist:
            return error_response(message='Integration not found', status_code=404)

        base_url = request.build_absolute_uri('/').rstrip('/')
        webhook_url = f'{base_url}/api/v1/channels/webhook/{integration.channel_type}/{integration.id}/'
        return success_response(data={'webhook_url': webhook_url})
