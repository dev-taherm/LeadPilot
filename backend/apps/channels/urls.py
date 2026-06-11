from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ChannelIntegrationViewSet, ChannelWebhookView, ChannelWebhookURLView

router = DefaultRouter()
router.register(r'', ChannelIntegrationViewSet, basename='channel')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/<str:channel_type>/<uuid:integration_id>/', ChannelWebhookView.as_view(), name='channel-webhook'),
    path('<uuid:integration_id>/webhook-url/', ChannelWebhookURLView.as_view(), name='channel-webhook-url'),
]
