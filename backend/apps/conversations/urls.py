from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ConversationViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')

nested_router = DefaultRouter()
nested_router.register(r'messages', MessageViewSet, basename='conversation-message')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'conversations/<uuid:conversation_pk>/',
        include(nested_router.urls),
    ),
]
