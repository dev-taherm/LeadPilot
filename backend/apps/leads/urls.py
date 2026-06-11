from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LeadNoteViewSet, LeadViewSet

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')

nested_router = DefaultRouter()
nested_router.register(r'notes', LeadNoteViewSet, basename='lead-note')

urlpatterns = [
    path('', include(router.urls)),
    path(
        'leads/<uuid:lead_pk>/',
        include(nested_router.urls),
    ),
]
