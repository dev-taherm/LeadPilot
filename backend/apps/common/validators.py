from django.core.exceptions import ValidationError
import re


def validate_phone(value):
    """Validate phone number format."""
    pattern = r'^\+?[\d\s\-\(\)]{7,20}$'
    if not re.match(pattern, value):
        raise ValidationError('Invalid phone number format.')


def validate_file_size(value, max_size_mb=10):
    """Validate file size doesn't exceed max_size_mb."""
    file_size = value.size
    max_size = max_size_mb * 1024 * 1024
    if file_size > max_size:
        raise ValidationError(f'File size cannot exceed {max_size_mb}MB.')


ALLOWED_DOCUMENT_TYPES = ['pdf', 'docx', 'txt', 'md']
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
