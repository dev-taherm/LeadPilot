from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from apps.common.responses import (
    success_response,
    error_response,
    created_response,
)

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    ChangePasswordSerializer,
    PasswordResetSerializer,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            if response.status_code == 200:
                return success_response(
                    data=response.data,
                    message='Login successful.',
                )
            return error_response(
                message='Invalid credentials.',
                status_code=response.status_code,
            )
        except Exception:
            return error_response(
                message='Invalid credentials.',
                status_code=status.HTTP_401_UNAUTHORIZED,
            )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message='Validation failed.',
                errors=serializer.errors,
            )
        try:
            user = serializer.save()
            from apps.common.tokens import get_tokens_for_user
            tokens = get_tokens_for_user(user)
            return created_response(
                data={
                    'user': UserSerializer(user).data,
                    'tokens': tokens,
                },
                message='Registration successful.',
            )
        except Exception as e:
            return error_response(
                message='Registration failed.',
                errors={'detail': str(e)},
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return error_response(message='Refresh token is required.')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return success_response(message='Logout successful.')
        except TokenError:
            return error_response(
                message='Invalid or expired token.',
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return error_response(
                message='Logout failed.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            serializer = UserSerializer(request.user)
            return success_response(data=serializer.data)
        except Exception:
            return error_response(
                message='Failed to retrieve profile.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return error_response(
                message='Validation failed.',
                errors=serializer.errors,
            )
        try:
            serializer.save()
            return success_response(
                data=serializer.data,
                message='Profile updated successfully.',
            )
        except Exception:
            return error_response(
                message='Failed to update profile.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        if not serializer.is_valid():
            return error_response(
                message='Validation failed.',
                errors=serializer.errors,
            )
        try:
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return success_response(message='Password changed successfully.')
        except Exception:
            return error_response(
                message='Failed to change password.',
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                message='Validation failed.',
                errors=serializer.errors,
            )
        return success_response(
            message='If the email exists, a password reset link has been sent.',
        )
