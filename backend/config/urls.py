from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/businesses/', include('apps.businesses.urls')),
    path('api/v1/leads/', include('apps.leads.urls')),
    path('api/v1/conversations/', include('apps.conversations.urls')),
    path('api/v1/agent/', include('apps.agent.urls')),
    path('api/v1/knowledge/', include('apps.knowledge.urls')),
    path('api/v1/calendar/', include('apps.calendar_integration.urls')),
    path('api/v1/dashboard/', include('apps.analytics.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/channels/', include('apps.channels.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
