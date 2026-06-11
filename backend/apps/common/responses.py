from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message='Success', status_code=status.HTTP_200_OK):
    payload = {'success': True, 'message': message}
    if data is not None:
        payload['data'] = data
    return Response(payload, status=status_code)


def error_response(message='Error', errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    payload = {'success': False, 'message': message}
    if errors:
        payload['errors'] = errors
    return Response(payload, status=status_code)


def created_response(data=None, message='Created successfully'):
    return success_response(data, message, status.HTTP_201_CREATED)


def no_content_response(message='Deleted successfully'):
    return success_response(message=message, status_code=status.HTTP_204_NO_CONTENT)
