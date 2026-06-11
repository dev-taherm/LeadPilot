import uuid
from django.db import models


class UUIDPrimaryKeyMixin:
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
