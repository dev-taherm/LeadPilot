from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AgentExecutionViewSet, AgentMemoryViewSet, AgentRunView

router = DefaultRouter()
router.register(r'executions', AgentExecutionViewSet, basename='agent-execution')
router.register(r'memories', AgentMemoryViewSet, basename='agent-memory')

urlpatterns = [
    path('run/', AgentRunView.as_view(), name='agent-run'),
    path('', include(router.urls)),
]
