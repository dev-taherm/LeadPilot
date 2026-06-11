import pytest
from django.urls import reverse
from rest_framework import status

from apps.users.models import User


@pytest.mark.django_db
class TestRegistration:
    def test_registration_success(self, api_client):
        url = reverse('register')
        payload = {
            'email': 'newuser@test.com',
            'password': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'User',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['success'] is True
        assert response.data['data']['user']['email'] == 'newuser@test.com'
        assert response.data['data']['tokens']['access']
        assert response.data['data']['tokens']['refresh']
        assert User.objects.filter(email='newuser@test.com').exists()

    def test_registration_with_business(self, api_client):
        url = reverse('register')
        payload = {
            'email': 'bizowner@test.com',
            'password': 'StrongPass123!',
            'first_name': 'Biz',
            'last_name': 'Owner',
            'business_name': 'My New Company',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        user = User.objects.get(email='bizowner@test.com')
        assert user.role == User.Role.BUSINESS_OWNER
        assert user.business is not None
        assert user.business.name == 'My New Company'

    def test_registration_duplicate_email(self, api_client, business_owner):
        url = reverse('register')
        payload = {
            'email': business_owner.email,
            'password': 'StrongPass123!',
            'first_name': 'Dup',
            'last_name': 'User',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_registration_missing_fields(self, api_client):
        url = reverse('register')
        response = api_client.post(url, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_registration_weak_password(self, api_client):
        url = reverse('register')
        payload = {
            'email': 'weak@test.com',
            'password': '123',
            'first_name': 'Weak',
            'last_name': 'Pass',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, api_client, business_owner):
        url = reverse('login')
        payload = {
            'email': business_owner.email,
            'password': 'testpass123',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert response.data['data']['access']
        assert response.data['data']['refresh']

    def test_login_invalid_credentials(self, api_client, business_owner):
        url = reverse('login')
        payload = {
            'email': business_owner.email,
            'password': 'wrongpassword',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_nonexistent_user(self, api_client):
        url = reverse('login')
        payload = {
            'email': 'nobody@test.com',
            'password': 'testpass123',
        }
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestTokenRefresh:
    def test_token_refresh(self, api_client, business_owner):
        from apps.common.tokens import get_tokens_for_user
        tokens = get_tokens_for_user(business_owner)
        url = reverse('token_refresh')
        payload = {'refresh': tokens['refresh']}
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['access']

    def test_token_refresh_invalid(self, api_client):
        url = reverse('token_refresh')
        payload = {'refresh': 'invalid-token-string'}
        response = api_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestProfile:
    def test_profile_get(self, auth_owner_client):
        url = reverse('profile')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['email'] == 'owner@test.com'
        assert response.data['data']['first_name'] == 'Test'

    def test_profile_update(self, auth_owner_client):
        url = reverse('profile')
        response = auth_owner_client.put(url, {'first_name': 'Updated'}, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['data']['first_name'] == 'Updated'

    def test_profile_unauthenticated(self, api_client):
        url = reverse('profile')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestChangePassword:
    def test_change_password_success(self, auth_owner_client):
        url = reverse('change-password')
        payload = {
            'old_password': 'testpass123',
            'new_password': 'NewStrongPass456!',
        }
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_change_password_wrong_old(self, auth_owner_client):
        url = reverse('change-password')
        payload = {
            'old_password': 'wrongoldpass',
            'new_password': 'NewStrongPass456!',
        }
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestLogout:
    def test_logout_blacklists_token(self, auth_owner_client):
        url = reverse('logout')
        payload = {'refresh': auth_owner_client._refresh_token}
        response = auth_owner_client.post(url, payload, format='json')
        assert response.status_code == status.HTTP_200_OK

    def test_logout_no_token(self, auth_owner_client):
        url = reverse('logout')
        response = auth_owner_client.post(url, {}, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
