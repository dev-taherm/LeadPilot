import pytest
from django.urls import reverse
from rest_framework import status

from apps.businesses.models import Business


@pytest.mark.django_db
class TestCreateBusiness:
    def test_create_business(self, auth_owner_client, business_owner):
        url = reverse('business-list')
        payload = {
            'name': 'New Test Business',
            'industry': 'Finance',
            'description': 'A finance business.',
            'services': ['Tax', 'Audit'],
            'faq': [],
            'timezone': 'UTC',
            'operating_hours': {},
        }
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert Business.objects.filter(name='New Test Business').exists()
        new_biz = Business.objects.get(name='New Test Business')
        assert new_biz.owner == business_owner


@pytest.mark.django_db
class TestListBusinesses:
    def test_list_businesses_owner(self, auth_owner_client, business):
        url = reverse('business-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        assert len(results) >= 1

    def test_list_businesses_shows_own(self, auth_owner_client, business):
        url = reverse('business-list')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data)
        slugs = [b['slug'] for b in results]
        assert business.slug in slugs


@pytest.mark.django_db
class TestUpdateBusiness:
    def test_update_business_owner(self, auth_owner_client, business):
        url = reverse('business-detail', kwargs={'slug': business.slug})
        payload = {'name': 'Updated Business Name', 'industry': 'Updated Industry'}
        response = auth_owner_client.patch(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        business.refresh_from_db()
        assert business.name == 'Updated Business Name'

    def test_update_business_staff_forbidden(self, auth_staff_client, business):
        url = reverse('business-detail', kwargs={'slug': business.slug})
        payload = {'name': 'Hacked Name'}
        response = auth_staff_client.patch(url, payload, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_update_business_name(self, auth_owner_client, business):
        url = reverse('business-detail', kwargs={'slug': business.slug})
        payload = {'description': 'New description.'}
        response = auth_owner_client.put(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        business.refresh_from_db()
        assert business.description == 'New description.'


@pytest.mark.django_db
class TestDeleteBusiness:
    def test_delete_business_soft_delete(self, auth_owner_client, business):
        url = reverse('business-detail', kwargs={'slug': business.slug})
        response = auth_owner_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        business.refresh_from_db()
        assert business.is_active is False
        assert Business.objects.filter(slug=business.slug).exists()


@pytest.mark.django_db
class TestTenantIsolation:
    def test_tenant_isolation_cannot_see_other_business(
        self, auth_owner_client, second_business
    ):
        url = reverse('business-detail', kwargs={'slug': second_business.slug})
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND
