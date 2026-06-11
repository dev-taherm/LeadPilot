class TenantAccessMixin:
    def get_queryset(self):
        qs = super().get_queryset()
        if hasattr(self.request, 'tenant') and self.request.tenant:
            return qs.filter(business=self.request.tenant)
        return qs.none()

    def perform_create(self, serializer):
        kwargs = {}
        if hasattr(serializer.Meta.model, 'business'):
            kwargs['business'] = self.request.tenant
        serializer.save(**kwargs)
