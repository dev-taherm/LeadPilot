import pytest
from datetime import timedelta
from django.urls import reverse
from django.utils import timezone
from rest_framework import status

from apps.analytics.models import AnalyticsSnapshot
from apps.analytics.tasks import compute_analytics


@pytest.mark.django_db
class TestDashboardEndpoint:
    def test_dashboard_endpoint(self, auth_owner_client, analytics_snapshots):
        url = reverse('dashboard')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.data.get('data', response.data)
        assert 'total_leads' in data
        assert 'new_leads' in data
        assert 'qualified_leads' in data
        assert 'meetings_booked' in data
        assert 'conversion_rate' in data
        assert 'period_start' in data
        assert 'period_end' in data
        assert 'trend' in data

    def test_dashboard_endpoint_empty(self, auth_owner_client, business):
        url = reverse('dashboard')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.data.get('data', response.data)
        assert data['total_leads'] == 0

    def test_dashboard_with_days_param(self, auth_owner_client, analytics_snapshots):
        url = reverse('dashboard')
        response = auth_owner_client.get(url, {'days': '7'})
        assert response.status_code == status.HTTP_200_OK
        data = response.data.get('data', response.data)
        assert 'period_start' in data

    def test_dashboard_unauthenticated(self, api_client):
        url = reverse('dashboard')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestAnalyticsDateFilter:
    def test_analytics_date_filter(self, auth_owner_client, analytics_snapshots):
        url = reverse('analytics-history')
        today = timezone.now().date()
        response = auth_owner_client.get(url, {
            'start_date': str(today - timedelta(days=5)),
            'end_date': str(today),
        })
        assert response.status_code == status.HTTP_200_OK
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(results) <= 6

    def test_analytics_history_empty(self, auth_owner_client, business):
        url = reverse('analytics-history')
        response = auth_owner_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_analytics_history_start_only(self, auth_owner_client, analytics_snapshots):
        url = reverse('analytics-history')
        today = timezone.now().date()
        response = auth_owner_client.get(url, {'start_date': str(today - timedelta(days=3))})
        assert response.status_code == status.HTTP_200_OK

    def test_analytics_history_end_only(self, auth_owner_client, analytics_snapshots):
        url = reverse('analytics-history')
        today = timezone.now().date()
        response = auth_owner_client.get(url, {'end_date': str(today - timedelta(days=25))})
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestComputeAnalyticsTask:
    def test_compute_analytics_task(self, business):
        today = timezone.now().date()
        result = compute_analytics(str(business.id), date=today)
        assert result is not None
        snap = AnalyticsSnapshot.objects.get(business=business, date=today)
        assert snap.total_leads >= 0
        assert snap.conversion_rate >= 0.0
        assert isinstance(snap.avg_response_time, float)

    def test_compute_analytics_idempotent(self, business):
        today = timezone.now().date()
        compute_analytics(str(business.id), date=today)
        first_id = AnalyticsSnapshot.objects.get(business=business, date=today).id
        compute_analytics(str(business.id), date=today)
        assert AnalyticsSnapshot.objects.filter(business=business, date=today).count() == 1
        assert AnalyticsSnapshot.objects.get(business=business, date=today).id == first_id

    def test_compute_analytics_with_leads(self, business):
        from apps.leads.models import Lead
        Lead.objects.create(business=business, name='A', email='a@t.com', status=Lead.Status.WON)
        Lead.objects.create(business=business, name='B', email='b@t.com', status=Lead.Status.NEW)
        today = timezone.now().date()
        compute_analytics(str(business.id), date=today)
        snap = AnalyticsSnapshot.objects.get(business=business, date=today)
        assert snap.total_leads >= 2
        assert snap.new_leads >= 1

    def test_compute_analytics_default_date(self, business):
        result = compute_analytics(str(business.id))
        assert result is not None
        today = timezone.now().date()
        assert AnalyticsSnapshot.objects.filter(business=business, date=today).exists()
