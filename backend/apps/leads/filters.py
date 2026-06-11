import django_filters

from .models import Lead


class LeadFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Lead.Status.choices)
    source = django_filters.ChoiceFilter(choices=Lead.Source.choices)
    score_min = django_filters.NumberFilter(field_name='score', lookup_expr='gte')
    score_max = django_filters.NumberFilter(field_name='score', lookup_expr='lte')
    assigned_to = django_filters.UUIDFilter(field_name='assigned_to__id')
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Lead
        fields = [
            'status', 'source', 'score_min', 'score_max',
            'assigned_to', 'created_after', 'created_before',
        ]
