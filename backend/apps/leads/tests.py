import pytest
from django.urls import reverse
from rest_framework import status

from apps.leads.models import Lead, LeadNote


@pytest.mark.django_db
class TestCreateLead:
    def test_create_lead(self, auth_owner_client, business):
        url = reverse('lead-list')
        payload = {
            'name': 'New Lead',
            'email': 'newlead@test.com',
            'phone': '+1-555-9999',
            'company': 'NewCo',
            'source': 'website',
            'status': 'new',
            'score': 75,
            'tags': ['test', 'new'],
        }
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Lead.objects.filter(email='newlead@test.com').exists()
        new_lead = Lead.objects.get(email='newlead@test.com')
        assert new_lead.business == business


@pytest.mark.django_db
class TestListLeads:
    def test_list_leads(self, auth_owner_client, lead):
        url = reverse('lead-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        ids = [str(l['id']) for l in results]
        assert str(lead.id) in ids

    def test_list_leads_multiple(self, auth_owner_client, business, staff_user):
        for i in range(5):
            Lead.objects.create(
                business=business,
                name=f'Bulk Lead {i}',
                email=f'bulk{i}@test.com',
                status=Lead.Status.NEW,
            )
        url = reverse('lead-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) >= 5


@pytest.mark.django_db
class TestFilterLeadsByStatus:
    def test_filter_leads_by_status(self, auth_owner_client, business):
        Lead.objects.create(business=business, name='New1', email='n1@t.com', status=Lead.Status.NEW)
        Lead.objects.create(business=business, name='Won1', email='w1@t.com', status=Lead.Status.WON)
        url = reverse('lead-list')
        response = auth_owner_client.get(url, {'status': 'won'})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        for lead_data in results:
            assert lead_data['status'] == 'won'

    def test_filter_leads_by_source(self, auth_owner_client, business):
        Lead.objects.create(business=business, name='Web1', email='web@t.com', status='new', source='website')
        Lead.objects.create(business=business, name='Social1', email='soc@t.com', status='new', source='social')
        url = reverse('lead-list')
        response = auth_owner_client.get(url, {'source': 'social'})
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        for lead_data in results:
            assert lead_data['source'] == 'social'


@pytest.mark.django_db
class TestUpdateLead:
    def test_update_lead(self, auth_owner_client, lead):
        url = reverse('lead-detail', kwargs={'pk': lead.id})
        payload = {'name': 'Updated Lead', 'score': 99}
        response = auth_owner_client.patch(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        lead.refresh_from_db()
        assert lead.name == 'Updated Lead'
        assert lead.score == 99

    def test_update_lead_full(self, auth_owner_client, lead):
        url = reverse('lead-detail', kwargs={'pk': lead.id})
        payload = {
            'name': 'Fully Updated',
            'email': 'updated@test.com',
            'phone': '+1-555-0000',
            'company': 'UpdatedCo',
            'source': 'referral',
            'status': 'qualified',
            'score': 88,
            'tags': ['updated'],
        }
        response = auth_owner_client.put(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        lead.refresh_from_db()
        assert lead.name == 'Fully Updated'


@pytest.mark.django_db
class TestDeleteLead:
    def test_delete_lead(self, auth_owner_client, lead):
        url = reverse('lead-detail', kwargs={'pk': lead.id})
        response = auth_owner_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Lead.objects.filter(id=lead.id).exists()


@pytest.mark.django_db
class TestAssignLead:
    def test_assign_lead(self, auth_owner_client, lead, staff_user):
        url = reverse('lead-assign', kwargs={'pk': lead.id})
        payload = {'user_id': str(staff_user.id)}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        lead.refresh_from_db()
        assert lead.assigned_to == staff_user

    def test_assign_lead_invalid_user(self, auth_owner_client, lead):
        url = reverse('lead-assign', kwargs={'pk': lead.id})
        payload = {'user_id': '00000000-0000-0000-0000-000000000000'}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_assign_lead_no_user_id(self, auth_owner_client, lead):
        url = reverse('lead-assign', kwargs={'pk': lead.id})
        response = auth_owner_client.post(url, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestUpdateLeadStatus:
    def test_update_lead_status(self, auth_owner_client, lead):
        url = reverse('lead-update-status', kwargs={'pk': lead.id})
        payload = {'status': 'qualified'}
        response = auth_owner_client.patch(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        lead.refresh_from_db()
        assert lead.status == 'qualified'

    def test_update_lead_status_invalid(self, auth_owner_client, lead):
        url = reverse('lead-update-status', kwargs={'pk': lead.id})
        payload = {'status': 'invalid_status'}
        response = auth_owner_client.patch(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestBulkUpdateStatus:
    def test_bulk_update_status(self, auth_owner_client, business):
        leads = []
        for i in range(3):
            lead = Lead.objects.create(
                business=business,
                name=f'Bulk {i}',
                email=f'bulk{i}@test.com',
                status=Lead.Status.NEW,
            )
            leads.append(lead)
        url = reverse('lead-bulk-update-status')
        payload = {
            'lead_ids': [str(l.id) for l in leads],
            'status': 'contacted',
        }
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['updated_count'] == 3
        for lead in leads:
            lead.refresh_from_db()
            assert lead.status == 'contacted'

    def test_bulk_update_status_invalid(self, auth_owner_client, lead):
        url = reverse('lead-bulk-update-status')
        payload = {
            'lead_ids': [str(lead.id)],
            'status': 'bad_status',
        }
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_bulk_update_status_empty(self, auth_owner_client):
        url = reverse('lead-bulk-update-status')
        payload = {'lead_ids': [], 'status': 'won'}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLeadNotes:
    def test_lead_notes(self, auth_owner_client, lead):
        url = reverse('lead-note-list', kwargs={'lead_pk': lead.id})
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_create_lead_note(self, auth_owner_client, lead):
        url = reverse('lead-note-list', kwargs={'lead_pk': lead.id})
        payload = {'content': 'This is a test note.'}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert LeadNote.objects.filter(lead=lead, content='This is a test note.').exists()


@pytest.mark.django_db
class TestLeadTenantIsolation:
    def test_tenant_isolation(self, auth_owner_client, second_business, second_business_owner):
        other_lead = Lead.objects.create(
            business=second_business,
            name='Other Lead',
            email='other@test.com',
            status=Lead.Status.NEW,
        )
        url = reverse('lead-detail', kwargs={'pk': other_lead.id})
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_tenant_isolation_list(self, auth_owner_client, second_business):
        Lead.objects.create(
            business=second_business,
            name='Hidden Lead',
            email='hidden@test.com',
            status=Lead.Status.NEW,
        )
        url = reverse('lead-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        emails = [l['email'] for l in results]
        assert 'hidden@test.com' not in emails
