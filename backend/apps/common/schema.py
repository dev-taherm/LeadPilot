from drf_spectacular.generators import AutoSchema


class CustomAutoSchema(AutoSchema):
    def get_tags(self, path, method):
        tags = super().get_tags(path, method)
        if not tags:
            path_segments = path.strip('/').split('/')
            if len(path_segments) >= 3 and path_segments[0] == 'api':
                return [path_segments[2]]
        return tags
