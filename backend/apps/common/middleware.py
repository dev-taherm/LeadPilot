from django.http import JsonResponse
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .logging import get_logger

logger = get_logger('middleware')

EXEMPT_PATHS = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/auth/password-reset',
    '/admin/',
]


class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant = None
        request.user_obj = None

        if self._is_exempt(request.path):
            return self.get_response(request)

        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                access_token = AccessToken(token)
                user_id = access_token['user_id']
                business_id = access_token.get('business_id')

                from apps.users.models import User
                try:
                    user = User.objects.select_related('business').get(id=user_id)
                    request.user_obj = user
                    if user.business_id:
                        request.tenant = user.business
                except User.DoesNotExist:
                    pass

            except (TokenError, InvalidToken):
                pass

        response = self.get_response(request)
        return response

    def _is_exempt(self, path):
        return any(path.startswith(exempt) for exempt in EXEMPT_PATHS)
