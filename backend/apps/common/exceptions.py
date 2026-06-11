from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'error': {
                'status_code': response.status_code,
                'message': _get_error_message(response),
                'details': response.data if isinstance(response.data, dict) else {'detail': response.data},
            }
        }
        response.data = error_data
    else:
        response = Response({
            'success': False,
            'error': {
                'status_code': 500,
                'message': 'Internal server error',
                'details': str(exc),
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response


def _get_error_message(response):
    if isinstance(response.data, dict):
        if 'detail' in response.data:
            return str(response.data['detail'])
        if 'non_field_errors' in response.data:
            return str(response.data['non_field_errors'][0])
    return 'An error occurred'
