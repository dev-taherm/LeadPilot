import pytest
from django.urls import reverse
from rest_framework import status
from unittest.mock import patch, MagicMock

from apps.agent.models import AgentExecution, AgentMemory


@pytest.mark.django_db
class TestAgentRunMock:
    @patch('apps.agent.views.AgentRunner')
    def test_agent_run_mock(self, MockRunner, auth_owner_client, lead):
        mock_instance = MagicMock()
        mock_instance.run.return_value = {
            'execution_id': 'test-id',
            'status': 'completed',
            'decision': 'send_email',
            'tool_output': {'email_sent': True},
            'messages': [{'role': 'assistant', 'content': 'Email sent successfully.'}],
        }
        MockRunner.return_value = mock_instance

        url = reverse('agent-run')
        payload = {'lead_id': str(lead.id)}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['data']['status'] == 'completed'
        mock_instance.run.assert_called_once()

    def test_agent_run_lead_not_found(self, auth_owner_client):
        url = reverse('agent-run')
        payload = {'lead_id': '00000000-0000-0000-0000-000000000000'}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_agent_run_invalid_payload(self, auth_owner_client):
        url = reverse('agent-run')
        response = auth_owner_client.post(url, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @patch('apps.agent.views.AgentRunner')
    def test_agent_run_failure(self, MockRunner, auth_owner_client, lead):
        mock_instance = MagicMock()
        mock_instance.run.return_value = {
            'execution_id': None,
            'status': 'failed',
            'error': 'AI model unavailable',
        }
        MockRunner.return_value = mock_instance

        url = reverse('agent-run')
        payload = {'lead_id': str(lead.id)}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    @patch('apps.agent.views.AgentRunner')
    def test_agent_tools_send_email(self, MockRunner, auth_owner_client, lead):
        mock_instance = MagicMock()
        mock_instance.run.return_value = {
            'execution_id': 'exec-1',
            'status': 'completed',
            'decision': 'send_email',
            'tool_output': {
                'tool': 'send_email',
                'to': lead.email,
                'subject': 'Follow-up',
                'body': 'Hello!',
                'email_sent': True,
            },
            'messages': [],
        }
        MockRunner.return_value = mock_instance

        url = reverse('agent-run')
        payload = {'lead_id': str(lead.id)}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['data']['tool_output']['email_sent'] is True
        assert response.data['data']['decision'] == 'send_email'

    @patch('apps.agent.views.AgentRunner')
    def test_agent_tools_create_note(self, MockRunner, auth_owner_client, lead):
        mock_instance = MagicMock()
        mock_instance.run.return_value = {
            'execution_id': 'exec-2',
            'status': 'completed',
            'decision': 'create_note',
            'tool_output': {
                'tool': 'create_note',
                'note_content': 'Lead expressed interest in premium plan.',
                'note_created': True,
            },
            'messages': [],
        }
        MockRunner.return_value = mock_instance

        url = reverse('agent-run')
        payload = {'lead_id': str(lead.id)}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['data']['tool_output']['note_created'] is True

    @patch('apps.agent.views.AgentRunner')
    def test_agent_tools_update_lead_status(self, MockRunner, auth_owner_client, lead):
        mock_instance = MagicMock()
        mock_instance.run.return_value = {
            'execution_id': 'exec-3',
            'status': 'completed',
            'decision': 'update_status',
            'tool_output': {
                'tool': 'update_lead_status',
                'new_status': 'qualified',
                'status_updated': True,
            },
            'messages': [],
        }
        MockRunner.return_value = mock_instance

        url = reverse('agent-run')
        payload = {'lead_id': str(lead.id)}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['data']['tool_output']['status_updated'] is True


@pytest.mark.django_db
class TestAgentExecutionHistory:
    def test_agent_execution_history(self, auth_owner_client, agent_execution):
        url = reverse('agent-execution-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        ids = [str(e['id']) for e in results]
        assert str(agent_execution.id) in ids

    def test_agent_execution_detail(self, auth_owner_client, agent_execution):
        url = reverse('agent-execution-detail', kwargs={'pk': agent_execution.id})
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'completed'
        assert response.data['lead_name'] == agent_execution.lead.name

    def test_agent_execution_filter_by_status(self, auth_owner_client, agent_execution):
        url = reverse('agent-execution-list')
        response = auth_owner_client.get(url, {'status': 'completed'})
        assert response.status_code == status.HTTP_200_OK

    def test_agent_execution_filter_by_lead(self, auth_owner_client, agent_execution):
        url = reverse('agent-execution-list')
        response = auth_owner_client.get(url, {'lead_id': str(agent_execution.lead.id)})
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestAgentMemoryPersistence:
    def test_agent_memory_list(self, auth_owner_client, agent_memory):
        url = reverse('agent-memory-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        ids = [str(m['id']) for m in results]
        assert str(agent_memory.id) in ids

    def test_agent_memory_detail(self, auth_owner_client, agent_memory):
        url = reverse('agent-memory-detail', kwargs={'pk': agent_memory.id})
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['memory_type'] == 'customer_info'

    def test_agent_memory_persists(self, auth_owner_client, business, lead):
        mem = AgentMemory.objects.create(
            business=business,
            lead=lead,
            memory_type=AgentMemory.MemoryType.CONVERSATION,
            content={'summary': 'Conversation summary', 'turns': 5},
        )
        url = reverse('agent-memory-detail', kwargs={'pk': mem.id})
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['content']['summary'] == 'Conversation summary'
        assert response.data['content']['turns'] == 5

    def test_agent_memory_filter_by_type(self, auth_owner_client, agent_memory):
        url = reverse('agent-memory-list')
        response = auth_owner_client.get(url, {'memory_type': 'customer_info'})
        assert response.status_code == status.HTTP_200_OK

    def test_agent_memory_filter_by_lead(self, auth_owner_client, agent_memory):
        url = reverse('agent-memory-list')
        response = auth_owner_client.get(url, {'lead_id': str(agent_memory.lead.id)})
        assert response.status_code == status.HTTP_200_OK
