import os

from django.conf import settings
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

from .models import KnowledgeDocument
from .serializers import KnowledgeDocumentSerializer, KnowledgeDocumentUploadSerializer
from .utils import extract_document_text


class KnowledgeDocumentViewSet(TenantAccessMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsPagination
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at']

    def get_queryset(self):
        return KnowledgeDocument.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return KnowledgeDocumentUploadSerializer
        return KnowledgeDocumentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doc_type = serializer.validated_data['document_type']
        file_obj = serializer.validated_data['file']

        ext_map = {
            'pdf': 'pdf',
            'docx': 'docx',
            'txt': 'txt',
            'md': 'md',
        }
        file_ext = os.path.splitext(file_obj.name)[1].lower().lstrip('.')
        if doc_type in ext_map:
            pass

        instance = serializer.save(business=request.tenant)

        try:
            file_path = instance.file.path
            extracted_text = extract_document_text(file_path, instance.document_type)
            instance.content = extracted_text
            instance.is_indexed = bool(extracted_text)
            instance.save(update_fields=['content', 'is_indexed', 'updated_at'])
        except Exception:
            pass

        return created_response(
            KnowledgeDocumentSerializer(instance).data,
            message='Document uploaded successfully',
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            KnowledgeDocumentSerializer(serializer.instance).data,
            message='Document updated successfully',
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return no_content_response(message='Document deleted successfully')

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return error_response(message='Search query (q) is required')

        qs = self.get_queryset().filter(content__icontains=query)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = KnowledgeDocumentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = KnowledgeDocumentSerializer(qs, many=True)
        return success_response(data=serializer.data)
