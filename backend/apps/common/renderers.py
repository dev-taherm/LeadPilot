from rest_framework.renderers import JSONRenderer


class StandardJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response', None)
        if response and not isinstance(data, dict):
            data = {'success': True, 'data': data}
        elif response and isinstance(data, dict) and 'success' not in data:
            data = {'success': True, **data}
        return super().render(data, accepted_media_type, renderer_context)
