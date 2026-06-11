from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from apps.common.mixins import TenantAccessMixin
from apps.common.pagination import StandardResultsPagination
from apps.common.responses import (
    created_response,
    error_response,
    no_content_response,
    success_response,
)

from .filters import LeadFilter
from .models import Lead, LeadNote
from .serializers import (
    LeadCreateSerializer,
    LeadListSerializer,
    LeadNoteCreateSerializer,
    LeadNoteSerializer,
    LeadSerializer,
)

User = get_user_model()


class LeadViewSet(TenantAccessMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    filterset_class = LeadFilter
    search_fields = ['name', 'email', 'phone', 'company']
    ordering_fields = ['created_at', 'score', 'status', 'name']

    def get_queryset(self):
        return Lead.objects.select_related('assigned_to').all()

    def get_serializer_class(self):
        if self.action == 'list':
            return LeadListSerializer
        if self.action == 'create':
            return LeadCreateSerializer
        return LeadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        lead = serializer.instance
        return created_response(
            LeadSerializer(lead).data,
            message='Lead created successfully',
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            LeadSerializer(serializer.instance).data,
            message='Lead updated successfully',
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return no_content_response(message='Lead deleted successfully')

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        lead = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return error_response(message='user_id is required')
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return error_response(message='User not found')
        lead.assigned_to = user
        lead.save(update_fields=['assigned_to', 'updated_at'])
        return success_response(
            LeadSerializer(lead).data,
            message='Lead assigned successfully',
        )

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        lead = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = [choice[0] for choice in Lead.Status.choices]
        if new_status not in valid_statuses:
            return error_response(
                message=f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            )
        lead.status = new_status
        lead.save(update_fields=['status', 'updated_at'])
        return success_response(
            LeadSerializer(lead).data,
            message='Lead status updated successfully',
        )

    @action(detail=False, methods=['post'], url_path='bulk-update-status')
    def bulk_update_status(self, request):
        lead_ids = request.data.get('lead_ids', [])
        new_status = request.data.get('status')
        valid_statuses = [choice[0] for choice in Lead.Status.choices]
        if new_status not in valid_statuses:
            return error_response(
                message=f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            )
        if not lead_ids:
            return error_response(message='lead_ids is required')
        updated = Lead.objects.filter(id__in=lead_ids).update(
            status=new_status,
        )
        return success_response(
            data={'updated_count': updated},
            message=f'{updated} leads updated successfully',
        )


class LeadNoteViewSet(TenantAccessMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    ordering_fields = ['created_at']

    def get_queryset(self):
        qs = LeadNote.objects.select_related('created_by').filter(
            lead__business=self.request.tenant,
        )
        lead_id = self.kwargs.get('lead_pk')
        if lead_id:
            qs = qs.filter(lead_id=lead_id)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return LeadNoteCreateSerializer
        return LeadNoteSerializer

    def perform_create(self, serializer):
        lead_id = self.kwargs.get('lead_pk')
        serializer.save(
            lead_id=lead_id,
            created_by=self.request.user,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        note = serializer.instance
        return created_response(
            LeadNoteSerializer(note).data,
            message='Lead note created successfully',
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return no_content_response(message='Lead note deleted successfully')
