from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class LeadCreateThrottle(UserRateThrottle):
    rate = '20/hour'
    scope = 'lead_create'


class AgentRunThrottle(UserRateThrottle):
    rate = '10/hour'
    scope = 'agent_run'


class AuthThrottle(AnonRateThrottle):
    rate = '10/hour'
    scope = 'auth'


class FileUploadThrottle(UserRateThrottle):
    rate = '5/hour'
    scope = 'file_upload'
