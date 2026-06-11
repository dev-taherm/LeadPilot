from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Business
from .serializers import BusinessSerializer, BusinessPublicSerializer, AIConfigSerializer


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
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]

    def get_business(self, slug):
        return Business.objects.get(slug=slug)

    def get(self, request, slug):
        business = self.get_business(slug)
        self.check_object_permissions(request, business)
        serializer = AIConfigSerializer(business)
        return Response(serializer.data)

    def put(self, request, slug):
        business = self.get_business(slug)
        self.check_object_permissions(request, business)
        if business.owner != request.user:
            return Response(
                {'detail': 'Only the owner can update AI config.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = AIConfigSerializer(business, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
