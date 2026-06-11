from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['email'] = user.email
    refresh['role'] = user.role
    if hasattr(user, 'business') and user.business:
        refresh['business_id'] = str(user.business.id)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }
