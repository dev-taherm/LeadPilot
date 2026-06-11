from datetime import timedelta

from django.db.models import Avg, Sum
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.responses import success_response
from apps.leads.models import Lead

from .models import AnalyticsSnapshot
from .serializers import AnalyticsSnapshotSerializer, DashboardSerializer


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = request.tenant
        if not business:
            return success_response(data={}, message='No business context')

        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        snapshot = AnalyticsSnapshot.objects.filter(
            business=business,
            date__gte=start_date,
            date__lte=end_date,
        ).order_by('-date').first()

        if not snapshot:
            snapshot_data = {
                'date': end_date,
                'period_start': start_date,
                'period_end': end_date,
                'total_leads': 0,
                'new_leads': 0,
                'qualified_leads': 0,
                'meetings_booked': 0,
                'conversion_rate': 0.0,
                'avg_response_time': 0.0,
                'ai_interactions': 0,
                'active_conversations': 0,
                'trend': {},
            }
        else:
            prev_start = start_date - timedelta(days=days)
            prev_snapshot = AnalyticsSnapshot.objects.filter(
                business=business,
                date__gte=prev_start,
                date__lt=start_date,
            ).order_by('-date').first()

            trend = {}
            if prev_snapshot:
                for field in ['total_leads', 'meetings_booked', 'conversion_rate']:
                    current = getattr(snapshot, field, 0)
                    prev = getattr(prev_snapshot, field, 0)
                    if prev > 0:
                        trend[field] = round(((current - prev) / prev) * 100, 1)
                    else:
                        trend[field] = 0.0

            snapshot_data = {
                'date': snapshot.date,
                'period_start': start_date,
                'period_end': end_date,
                'total_leads': snapshot.total_leads,
                'new_leads': snapshot.new_leads,
                'qualified_leads': snapshot.qualified_leads,
                'meetings_booked': snapshot.meetings_booked,
                'conversion_rate': snapshot.conversion_rate,
                'avg_response_time': snapshot.avg_response_time,
                'ai_interactions': snapshot.ai_interactions,
                'active_conversations': snapshot.active_conversations,
                'trend': trend,
            }

        serializer = DashboardSerializer(snapshot_data)
        return success_response(data=serializer.data)


class AnalyticsListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AnalyticsSnapshotSerializer

    def get_queryset(self):
        business = self.request.tenant
        if not business:
            return AnalyticsSnapshot.objects.none()
        qs = AnalyticsSnapshot.objects.filter(business=business)
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(date__gte=start_date)
        if end_date:
            qs = qs.filter(date__lte=end_date)
        return qs
