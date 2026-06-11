from django.conf import settings
from django.db import models
from django.utils.text import slugify
import uuid


class Business(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    logo = models.ImageField(upload_to='business_logos/', blank=True, null=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    services = models.JSONField(default=list, blank=True)
    faq = models.JSONField(default=list, blank=True)
    timezone = models.CharField(max_length=50, default='UTC')
    operating_hours = models.JSONField(default=dict, blank=True)
    ai_prompt_config = models.JSONField(default=dict, blank=True)
    ai_provider = models.CharField(
        max_length=30,
        choices=[
            ('', 'Not Configured'),
            ('mock', 'Mock (No LLM)'),
            ('openai', 'OpenAI'),
            ('openai_compatible', 'OpenAI-Compatible (OpenRouter, Together, Groq, etc.)'),
            ('ollama', 'Ollama (Local AI)'),
            ('anthropic', 'Anthropic (Claude)'),
            ('google', 'Google Gemini'),
            ('mistral', 'Mistral AI'),
            ('local', 'Local LLM (LM Studio, vLLM, etc.)'),
        ],
        default='',
    )
    ai_api_key = models.CharField(max_length=500, blank=True, default='')
    ai_base_url = models.URLField(max_length=500, blank=True, default='')
    ai_model = models.CharField(max_length=100, blank=True, default='')
    ai_temperature = models.FloatField(default=0.7)
    ai_max_tokens = models.IntegerField(default=1024)
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_business',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Business.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
