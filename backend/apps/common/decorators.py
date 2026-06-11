from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def require_tenant(view_func):
    """Decorator to ensure request has a tenant context."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'tenant') or request.tenant is None:
            return Response(
                {'success': False, 'message': 'Tenant context required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper


def require_owner(view_func):
    """Decorator to ensure current user is business owner."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not hasattr(request, 'user_obj') or request.user_obj is None:
            return Response(
                {'success': False, 'message': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if request.user_obj.role != 'business_owner' and request.user_obj.role != 'super_admin':
            return Response(
                {'success': False, 'message': 'Owner permission required'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper
