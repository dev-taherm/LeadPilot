import pytest
from django.urls import reverse
from rest_framework import status

from apps.conversations.models import Conversation, Message


@pytest.mark.django_db
class TestCreateConversation:
    def test_create_conversation(self, auth_owner_client, business, lead):
        url = reverse('conversation-list')
        payload = {
            'lead': str(lead.id),
            'channel': 'web',
        }
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Conversation.objects.filter(lead=lead, business=business).exists()


@pytest.mark.django_db
class TestListConversations:
    def test_list_conversations(self, auth_owner_client, conversation):
        url = reverse('conversation-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        ids = [str(c['id']) for c in results]
        assert str(conversation.id) in ids

    def test_list_conversations_shows_lead_info(self, auth_owner_client, conversation):
        url = reverse('conversation-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        for conv in results:
            assert 'lead' in conv
            assert 'name' in conv['lead']


@pytest.mark.django_db
class TestSendMessage:
    def test_send_message(self, auth_owner_client, conversation):
        url = reverse('conversation-message-list', kwargs={'conversation_pk': conversation.id})
        payload = {
            'content': 'Hello from staff!',
            'channel': 'web',
        }
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        msg = Message.objects.filter(conversation=conversation).order_by('-created_at').first()
        assert msg.content == 'Hello from staff!'
        assert msg.sender_type == Message.SenderType.STAFF

    def test_send_message_updates_last_message_at(self, auth_owner_client, conversation):
        old_time = conversation.last_message_at
        url = reverse('conversation-message-list', kwargs={'conversation_pk': conversation.id})
        payload = {'content': 'Check timestamp update.', 'channel': 'web'}
        auth_owner_client.post(url, payload, format='json')
        conversation.refresh_from_db()
        assert conversation.last_message_at is not None


@pytest.mark.django_db
class TestPauseAI:
    def test_pause_ai(self, auth_owner_client, conversation):
        url = reverse('conversation-pause-ai', kwargs={'pk': conversation.id})
        response = auth_owner_client.post(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        conversation.refresh_from_db()
        assert conversation.ai_paused is True
        assert Message.objects.filter(
            conversation=conversation,
            sender_type=Message.SenderType.SYSTEM,
            content__contains='paused',
        ).exists()

    def test_pause_ai_already_paused(self, auth_owner_client, conversation):
        conversation.ai_paused = True
        conversation.save(update_fields=['ai_paused'])
        url = reverse('conversation-pause-ai', kwargs={'pk': conversation.id})
        response = auth_owner_client.post(url, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestResumeAI:
    def test_resume_ai(self, auth_owner_client, conversation):
        conversation.ai_paused = True
        conversation.save(update_fields=['ai_paused'])
        url = reverse('conversation-resume-ai', kwargs={'pk': conversation.id})
        response = auth_owner_client.post(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        conversation.refresh_from_db()
        assert conversation.ai_paused is False

    def test_resume_ai_not_paused(self, auth_owner_client, conversation):
        url = reverse('conversation-resume-ai', kwargs={'pk': conversation.id})
        response = auth_owner_client.post(url, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestHandoff:
    def test_handoff(self, auth_owner_client, conversation, staff_user):
        url = reverse('conversation-handoff', kwargs={'pk': conversation.id})
        response = auth_owner_client.post(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        conversation.refresh_from_db()
        assert conversation.status == Conversation.Status.AI_HANDOFF
        assert conversation.ai_paused is True
        assert conversation.assigned_to is not None


@pytest.mark.django_db
class TestCloseConversation:
    def test_close_conversation(self, auth_owner_client, conversation):
        url = reverse('conversation-close', kwargs={'pk': conversation.id})
        response = auth_owner_client.post(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        conversation.refresh_from_db()
        assert conversation.status == Conversation.Status.CLOSED
        assert Message.objects.filter(
            conversation=conversation,
            sender_type=Message.SenderType.SYSTEM,
            content='Conversation closed',
        ).exists()


@pytest.mark.django_db
class TestConversationTenantIsolation:
    def test_tenant_isolation(self, auth_owner_client, second_business, second_business_owner):
        other_lead = __import__('apps.leads.models', fromlist=['Lead']).Lead.objects.create(
            business=second_business,
            name='Other Lead',
            email='otherlead@test.com',
            status='new',
        )
        other_conv = Conversation.objects.create(
            business=second_business,
            lead=other_lead,
            status='active',
            channel='web',
        )
        url = reverse('conversation-detail', kwargs={'pk': other_conv.id})
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_tenant_isolation_list(self, auth_owner_client, second_business):
        url = reverse('conversation-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        for conv in results:
            assert conv.get('business') != str(second_business.id)
