import uuid

from django.db import models


class KnowledgeDocument(models.Model):
    class DocumentType(models.TextChoices):
        PDF = 'pdf', 'PDF'
        DOCX = 'docx', 'DOCX'
        TXT = 'txt', 'TXT'
        MD = 'md', 'Markdown'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='knowledge_documents',
    )
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='knowledge/%Y/%m/')
    content = models.TextField(blank=True)
    document_type = models.CharField(
        max_length=10,
        choices=DocumentType.choices,
    )
    is_indexed = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
