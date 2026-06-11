from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Business
from .serializers import (
    BusinessSerializer,
    BusinessPublicSerializer,
    AIConfigSerializer,
    ProviderDefaultsSerializer,
    PROVIDER_DEFAULTS,
)


class IsOwnerOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.owner == request.user


class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Business.objects.all()
        return Business.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        business = self.get_object()
        if business.owner != request.user:
            return Response(
                {'detail': 'Only the owner can delete a business.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        business.is_active = False
        business.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AIConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_business(self, request):
        if hasattr(request, 'tenant') and request.tenant:
            return request.tenant
        return Business.objects.filter(owner=request.user).first()

    def get(self, request):
        business = self.get_business(request)
        if not business:
            return Response(
                {'detail': 'No business found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = AIConfigSerializer(business)
        return Response(serializer.data)

    def put(self, request):
        business = self.get_business(request)
        if not business:
            return Response(
                {'detail': 'No business found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if business.owner != request.user and request.user.role != 'super_admin':
            return Response(
                {'detail': 'Only the owner can update AI config.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = AIConfigSerializer(business, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AIConfigSerializer(business).data)


class ProviderDefaultsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = request.query_params.get('provider', 'mock')
        defaults = PROVIDER_DEFAULTS.get(provider, PROVIDER_DEFAULTS['mock'])
        return Response(defaults)
