from django.urls import path

from .views import AnalyticsListView, DashboardView

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('history/', AnalyticsListView.as_view(), name='analytics-history'),
]
