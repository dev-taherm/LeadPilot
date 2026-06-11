import uuid

from django.db import models


class AgentExecution(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        RUNNING = 'running', 'Running'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        PAUSED = 'paused', 'Paused'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lead = models.ForeignKey(
        'leads.Lead',
        on_delete=models.CASCADE,
        related_name='agent_executions',
    )
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='agent_executions',
    )
    conversation = models.ForeignKey(
        'conversations.Conversation',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='agent_executions',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"AgentExecution({self.lead.name} - {self.status})"


class AgentMemory(models.Model):
    class MemoryType(models.TextChoices):
        CONVERSATION = 'conversation', 'Conversation'
        BUSINESS_PROFILE = 'business_profile', 'Business Profile'
        CUSTOMER_INFO = 'customer_info', 'Customer Info'
        INTERACTION = 'interaction', 'Interaction'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business = models.ForeignKey(
        'businesses.Business',
        on_delete=models.CASCADE,
        related_name='agent_memories',
    )
    lead = models.ForeignKey(
        'leads.Lead',
        on_delete=models.CASCADE,
        related_name='agent_memories',
        null=True,
        blank=True,
    )
    memory_type = models.CharField(
        max_length=30,
        choices=MemoryType.choices,
    )
    content = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        lead_part = f" ({self.lead.name})" if self.lead else ""
        return f"AgentMemory({self.memory_type}{lead_part})"
