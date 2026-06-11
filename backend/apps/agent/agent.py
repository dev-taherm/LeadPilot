import logging
from datetime import datetime, timezone as tz

from django.db import transaction

from .graph import get_compiled_graph
from .models import AgentExecution

logger = logging.getLogger(__name__)


def get_or_create_conversation(lead, business):
    try:
        from apps.conversations.models import Conversation

        conversation, _ = Conversation.objects.get_or_create(
            lead=lead,
            business=business,
            defaults={'status': 'active'},
        )
        return conversation
    except ImportError:
        logger.warning("Conversations app not available, returning None")
        return None


class AgentRunner:
    def __init__(self, lead, business, conversation=None):
        self.lead = lead
        self.business = business
        self.conversation = conversation or get_or_create_conversation(lead, business)
        self.execution = None

    @transaction.atomic
    def _create_execution(self) -> AgentExecution:
        self.execution = AgentExecution.objects.create(
            lead=self.lead,
            business=self.business,
            conversation=self.conversation,
            status=AgentExecution.Status.PENDING,
            input_data={
                'lead_id': str(self.lead.id),
                'business_id': str(self.business.id),
                'conversation_id': str(self.conversation.id) if self.conversation else None,
            },
        )
        return self.execution

    @transaction.atomic
    def _update_execution(self, status, output_data=None, error_message=''):
        if self.execution:
            update_fields = ['status', 'updated_at'] if hasattr(self.execution, 'updated_at') else ['status']
            self.execution.status = status
            if output_data is not None:
                self.execution.output_data = output_data
                update_fields.append('output_data')
            if error_message:
                self.execution.error_message = error_message
                update_fields.append('error_message')
            if status == AgentExecution.Status.RUNNING and not self.execution.started_at:
                self.execution.started_at = tz.now()
                update_fields.append('started_at')
            if status in (AgentExecution.Status.COMPLETED, AgentExecution.Status.FAILED):
                self.execution.completed_at = tz.now()
                update_fields.append('completed_at')
            self.execution.save(update_fields=update_fields)

    def run(self) -> dict:
        self._create_execution()
        self._update_execution(AgentExecution.Status.RUNNING)

        try:
            graph = get_compiled_graph()

            conversation_history = []
            if self.conversation:
                try:
                    from apps.conversations.models import Message

                    msgs = Message.objects.filter(
                        conversation=self.conversation,
                    ).order_by('created_at')
                    conversation_history = [
                        {'role': m.role, 'content': m.content}
                        for m in msgs
                    ]
                except (ImportError, AttributeError):
                    pass

            initial_state = {
                'lead_id': str(self.lead.id),
                'business_id': str(self.business.id),
                'conversation_id': str(self.conversation.id) if self.conversation else None,
                'lead_data': {},
                'business_data': {},
                'conversation_history': conversation_history,
                'memory': [],
                'decision': '',
                'tool_output': {},
                'messages': [],
                'should_finish': False,
            }

            result = graph.invoke(initial_state)

            self._update_execution(
                AgentExecution.Status.COMPLETED,
                output_data={
                    'decision': result.get('decision', ''),
                    'tool_output': result.get('tool_output', {}),
                    'messages': [
                        m if isinstance(m, dict) else {'role': 'assistant', 'content': str(m)}
                        for m in result.get('messages', [])
                    ],
                },
            )

            return {
                'execution_id': str(self.execution.id),
                'status': 'completed',
                'decision': result.get('decision', ''),
                'tool_output': result.get('tool_output', {}),
                'messages': result.get('messages', []),
            }

        except Exception as exc:
            logger.exception("Agent execution failed: %s", exc)
            self._update_execution(
                AgentExecution.Status.FAILED,
                error_message=str(exc),
            )
            return {
                'execution_id': str(self.execution.id) if self.execution else None,
                'status': 'failed',
                'error': str(exc),
            }

    def pause(self):
        if self.execution and self.execution.status == AgentExecution.Status.RUNNING:
            self._update_execution(AgentExecution.Status.PAUSED)
            return True
        return False

    def resume(self):
        if self.execution and self.execution.status == AgentExecution.Status.PAUSED:
            self._update_execution(AgentExecution.Status.RUNNING)
            return self.run()
        return {'status': 'error', 'error': 'Execution is not paused'}
