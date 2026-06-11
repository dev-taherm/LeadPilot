import random
from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.users.models import User
from apps.businesses.models import Business
from apps.leads.models import Lead, LeadNote
from apps.conversations.models import Conversation, Message
from apps.analytics.models import AnalyticsSnapshot
from apps.agent.models import AgentExecution, AgentMemory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def business_owner(db):
    user = User.objects.create_user(
        email='owner@test.com',
        password='testpass123',
        first_name='Test',
        last_name='Owner',
        role=User.Role.BUSINESS_OWNER,
    )
    business = Business.objects.create(
        name='Test Business',
        owner=user,
        industry='Technology',
        description='A test business.',
        services=['Consulting'],
        faq=[{'q': 'Test?', 'a': 'Test answer.'}],
        timezone='UTC',
        operating_hours={'mon': '9-17'},
    )
    user.business = business
    user.save(update_fields=['business'])
    return user


@pytest.fixture
def business(business_owner):
    return business_owner.business


@pytest.fixture
def staff_user(business):
    user = User.objects.create_user(
        email='staff@test.com',
        password='testpass123',
        first_name='Test',
        last_name='Staff',
        role=User.Role.STAFF,
        business=business,
    )
    return user


@pytest.fixture
def superadmin(db):
    return User.objects.create_superuser(
        email='admin@test.com',
        password='adminpass123',
        first_name='Admin',
        last_name='Super',
        role=User.Role.SUPER_ADMIN,
    )


@pytest.fixture
def second_business_owner(db):
    user = User.objects.create_user(
        email='owner2@test.com',
        password='testpass123',
        first_name='Second',
        last_name='Owner',
        role=User.Role.BUSINESS_OWNER,
    )
    business = Business.objects.create(
        name='Second Business',
        owner=user,
        industry='Legal',
        description='Another test business.',
    )
    user.business = business
    user.save(update_fields=['business'])
    return user


@pytest.fixture
def second_business(second_business_owner):
    return second_business_owner.business


@pytest.fixture
def lead(business, staff_user):
    return Lead.objects.create(
        business=business,
        name='Test Lead',
        email='lead@test.com',
        phone='+1-555-0001',
        company='TestCorp',
        source='website',
        status=Lead.Status.NEW,
        score=50,
        assigned_to=staff_user,
        tags=['test'],
    )


@pytest.fixture
def conversation(business, lead, staff_user):
    conv = Conversation.objects.create(
        business=business,
        lead=lead,
        status=Conversation.Status.ACTIVE,
        channel='web',
        assigned_to=staff_user,
        last_message_at=timezone.now(),
    )
    Message.objects.create(
        conversation=conv,
        sender_type=Message.SenderType.LEAD,
        content='Hello, I am interested.',
        channel='web',
    )
    Message.objects.create(
        conversation=conv,
        sender_type=Message.SenderType.AI,
        content='Hi! How can I help you?',
        channel='web',
        is_ai_generated=True,
    )
    return conv


@pytest.fixture
def message(conversation):
    return Message.objects.create(
        conversation=conversation,
        sender_type=Message.SenderType.STAFF,
        content='I will follow up with you shortly.',
        channel='web',
    )


@pytest.fixture
def auth_owner_client(api_client, business_owner):
    from apps.common.tokens import get_tokens_for_user
    tokens = get_tokens_for_user(business_owner)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
    api_client._refresh_token = tokens['refresh']
    return api_client


@pytest.fixture
def auth_staff_client(api_client, staff_user):
    from apps.common.tokens import get_tokens_for_user
    tokens = get_tokens_for_user(staff_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
    api_client._refresh_token = tokens['refresh']
    return api_client


@pytest.fixture
def auth_admin_client(api_client, superadmin):
    from apps.common.tokens import get_tokens_for_user
    tokens = get_tokens_for_user(superadmin)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {tokens["access"]}')
    api_client._refresh_token = tokens['refresh']
    return api_client


@pytest.fixture
def agent_execution(business, lead, conversation):
    return AgentExecution.objects.create(
        lead=lead,
        business=business,
        conversation=conversation,
        status=AgentExecution.Status.COMPLETED,
        input_data={'lead_id': str(lead.id), 'business_id': str(business.id)},
        output_data={'decision': 'send_email', 'tool_output': {'email_sent': True}},
        started_at=timezone.now() - timedelta(hours=1),
        completed_at=timezone.now(),
    )


@pytest.fixture
def agent_memory(business, lead):
    return AgentMemory.objects.create(
        business=business,
        lead=lead,
        memory_type=AgentMemory.MemoryType.CUSTOMER_INFO,
        content={'summary': 'Interested in enterprise plan', 'key_points': ['budget 50k', 'decision by Q2']},
    )


@pytest.fixture
def analytics_snapshots(business):
    today = timezone.now().date()
    snapshots = []
    for i in range(30):
        date = today - timedelta(days=i)
        snap, _ = AnalyticsSnapshot.objects.update_or_create(
            business=business,
            date=date,
            defaults={
                'total_leads': 10 + i,
                'new_leads': random.randint(1, 5),
                'qualified_leads': random.randint(0, 3),
                'meetings_booked': random.randint(0, 2),
                'conversion_rate': round(random.uniform(10.0, 30.0), 1),
                'avg_response_time': round(random.uniform(1.0, 4.0), 1),
                'ai_interactions': random.randint(3, 10),
                'active_conversations': random.randint(1, 5),
            },
        )
        snapshots.append(snap)
    return snapshots
