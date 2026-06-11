from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessViewSet, AIConfigView

router = DefaultRouter()
router.register('', BusinessViewSet, basename='business')

urlpatterns = [
    path('<slug:slug>/ai-config/', AIConfigView.as_view(), name='business-ai-config'),
    path('', include(router.urls)),
]
