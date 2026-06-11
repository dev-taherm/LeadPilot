from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessViewSet, AIConfigView, ProviderDefaultsView

router = DefaultRouter()
router.register('', BusinessViewSet, basename='business')

urlpatterns = [
    path('ai-config/', AIConfigView.as_view(), name='business-ai-config'),
    path('ai-config/defaults/', ProviderDefaultsView.as_view(), name='provider-defaults'),
    path('', include(router.urls)),
]
