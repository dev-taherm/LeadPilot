from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Business
from .serializers import (
    BusinessSerializer,
    BusinessPublicSerializer,
    AIConfigSerializer,
    ProviderDefaultsSerializer,
    PROVIDER_DEFAULTS,
)


class IsOwnerOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return obj.owner == request.user


class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrStaff]
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Business.objects.all()
        return Business.objects.filter(owner=user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def destroy(self, request, *args, **kwargs):
        business = self.get_object()
        if business.owner != request.user:
            return Response(
                {'detail': 'Only the owner can delete a business.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        business.is_active = False
        business.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AIConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_business(self, request):
        if hasattr(request, 'tenant') and request.tenant:
            return request.tenant
        return Business.objects.filter(owner=request.user).first()

    def get(self, request):
        business = self.get_business(request)
        if not business:
            return Response(
                {'detail': 'No business found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = AIConfigSerializer(business)
        return Response(serializer.data)

    def put(self, request):
        business = self.get_business(request)
        if not business:
            return Response(
                {'detail': 'No business found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if business.owner != request.user and request.user.role != 'super_admin':
            return Response(
                {'detail': 'Only the owner can update AI config.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = AIConfigSerializer(business, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AIConfigSerializer(business).data)


class ProviderDefaultsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        provider = request.query_params.get('provider', '')
        defaults = PROVIDER_DEFAULTS.get(provider, {'base_url': '', 'model': ''})
        return Response(defaults)


class AITestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from apps.agent.graph import _build_llm

        business = None
        if hasattr(request, 'tenant') and request.tenant:
            business = request.tenant
        if not business:
            business = Business.objects.filter(owner=request.user).first()
        if not business:
            return Response(
                {'detail': 'No business found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        provider = business.ai_provider
        if not provider:
            return Response(
                {'detail': 'Please select an AI provider first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        llm = _build_llm({
            'ai_provider': business.ai_provider,
            'ai_api_key': business.ai_api_key,
            'ai_base_url': business.ai_base_url,
            'ai_model': business.ai_model,
            'ai_temperature': business.ai_temperature,
            'ai_max_tokens': business.ai_max_tokens,
        })
        if llm is None:
            return Response(
                {'detail': f'Failed to initialize LLM for provider "{provider}". Check that the required package is installed.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        system_prompt = request.data.get('system_prompt', '')
        tone = request.data.get('personality_tone', 'professional')
        criteria = request.data.get('qualification_criteria', '')

        test_message = (
            "You are a test lead named Alex from Acme Corp. "
            "Send a short introductory message as if you just visited the company website "
            "and are interested in their services. Keep it under 2 sentences."
        )

        from langchain_core.messages import HumanMessage, SystemMessage

        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=test_message))

        try:
            response = llm.invoke(messages)
            return Response({'response': response.content})
        except Exception as exc:
            error_msg = str(exc)
            if 'API_KEY_INVALID' in error_msg or 'invalid api key' in error_msg.lower():
                return Response(
                    {'detail': 'Invalid API key. Please check your credentials.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if 'RESOURCE_EXHAUSTED' in error_msg or '429' in error_msg:
                return Response(
                    {'detail': 'API quota exceeded. Please check your plan and billing details.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response(
                {'detail': f'AI request failed: {error_msg[:200]}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )
