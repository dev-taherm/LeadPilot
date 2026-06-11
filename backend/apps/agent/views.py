import logging

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.pagination import StandardResultsPagination
from apps.common.responses import created_response, error_response, success_response
from apps.leads.models import Lead

from .agent import AgentRunner
from .models import AgentExecution, AgentMemory
from .serializers import (
    AgentExecutionSerializer,
    AgentMemorySerializer,
    AgentRunSerializer,
)

logger = logging.getLogger(__name__)


class AgentRunView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AgentRunSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        lead_id = serializer.validated_data['lead_id']

        try:
            lead = Lead.objects.get(id=lead_id)
        except Lead.DoesNotExist:
            return error_response(message='Lead not found', status_code=404)

        business = lead.business
        if not business:
            return error_response(
                message='Lead is not associated with a business',
                status_code=400,
            )

        runner = AgentRunner(lead=lead, business=business)
        result = runner.run()

        if result.get('status') == 'failed':
            return error_response(
                message=f"Agent execution failed: {result.get('error', 'Unknown error')}",
                status_code=500,
            )

        return created_response(data=result, message='Agent execution completed')


class AgentExecutionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    serializer_class = AgentExecutionSerializer
    ordering_fields = ['created_at', 'status']

    def get_queryset(self):
        qs = AgentExecution.objects.select_related('lead', 'business').all()
        business_id = self.request.query_params.get('business_id')
        if business_id:
            qs = qs.filter(business_id=business_id)
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class AgentMemoryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    serializer_class = AgentMemorySerializer
    ordering_fields = ['created_at', 'memory_type']

    def get_queryset(self):
        qs = AgentMemory.objects.select_related('lead', 'business').all()
        business_id = self.request.query_params.get('business_id')
        if business_id:
            qs = qs.filter(business_id=business_id)
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        memory_type = self.request.query_params.get('memory_type')
        if memory_type:
            qs = qs.filter(memory_type=memory_type)
        return qs
