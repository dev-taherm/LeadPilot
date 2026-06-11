# API Documentation

Base URL: `http://localhost:8000/api/v1`

---

## Authentication

LeadFlow AI uses **JWT (JSON Web Token)** authentication with access and refresh tokens.

### Obtaining Tokens

```
POST /api/v1/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Using Tokens

Include the access token in the `Authorization` header for all authenticated requests:

```
Authorization: Bearer <access_token>
```

### Refreshing Tokens

```
POST /api/v1/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Token Lifetimes

| Token | Default Lifetime |
|-------|-----------------|
| Access | 15 minutes |
| Refresh | 7 days |

Configure via `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` and `JWT_REFRESH_TOKEN_LIFETIME_DAYS` environment variables.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful.",
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message.",
  "errors": { ... }
}
```

### Standard Error Structure

```json
{
  "success": false,
  "error": {
    "status_code": 400,
    "message": "Validation failed.",
    "details": {
      "field_name": ["This field is required."]
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Pagination

All list endpoints support pagination using page number pagination.

**Query Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `page` | 1 | Page number |
| `page_size` | 20 | Items per page (max 100) |

**Response Format:**

```json
{
  "success": true,
  "pagination": {
    "count": 150,
    "total_pages": 8,
    "current_page": 1,
    "page_size": 20,
    "next": "http://localhost:8000/api/v1/leads/?page=2",
    "previous": null
  },
  "results": [ ... ]
}
```

---

## Filtering & Search

List endpoints support filtering, search, and ordering via query parameters.

**Filtering:**

```
GET /api/v1/leads/?status=new&source=website
```

**Search:**

```
GET /api/v1/leads/?search=john
```

**Ordering:**

```
GET /api/v1/leads/?ordering=-created_at
GET /api/v1/leads/?ordering=score
```

---

## Auth Endpoints

### POST `/api/v1/auth/register/`

Register a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "business_name": "Acme Corp"
}
```

`business_name` is optional. If provided, the user becomes a `business_owner` and a new business is created.

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "business_owner",
      "phone": "",
      "avatar": null,
      "business": {
        "id": "uuid-string",
        "name": "Acme Corp"
      },
      "date_joined": "2026-01-01T00:00:00Z"
    },
    "tokens": {
      "access": "eyJhbGciOiJIUzI1NiIs...",
      "refresh": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

### POST `/api/v1/auth/login/`

Obtain JWT tokens.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### POST `/api/v1/auth/logout/`

Blacklist the refresh token (requires authentication).

**Request:**

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Logout successful."
}
```

### POST `/api/v1/auth/refresh/`

Refresh the access token.

**Request:**

```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "access": "eyJhbGciOiJIUzI1NiIs...",
    "refresh": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### GET `/api/v1/auth/profile/`

Get the current user's profile.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Success.",
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "business_owner",
    "phone": "+1234567890",
    "avatar": "/media/avatars/avatar.jpg",
    "business": {
      "id": "uuid-string",
      "name": "Acme Corp"
    },
    "date_joined": "2026-01-01T00:00:00Z"
  }
}
```

### PUT `/api/v1/auth/profile/`

Update the current user's profile.

**Request:**

```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+1987654321"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "id": "uuid-string",
    "email": "user@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "business_owner",
    "phone": "+1987654321",
    "avatar": null,
    "business": {
      "id": "uuid-string",
      "name": "Acme Corp"
    },
    "date_joined": "2026-01-01T00:00:00Z"
  }
}
```

### POST `/api/v1/auth/change-password/`

Change the current user's password.

**Request:**

```json
{
  "old_password": "currentpassword",
  "new_password": "newsecurepassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully."
}
```

### POST `/api/v1/auth/password-reset/`

Request a password reset (sends email if configured).

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent."
}
```

---

## Business Endpoints

### GET `/api/v1/businesses/`

List all businesses the current user owns or has access to.

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": {
    "count": 1,
    "total_pages": 1,
    "current_page": 1,
    "page_size": 20,
    "next": null,
    "previous": null
  },
  "results": [
    {
      "id": "uuid-string",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "logo": "/media/business_logos/logo.png",
      "website": "https://acme.com",
      "industry": "Technology",
      "description": "Leading tech company",
      "services": ["Consulting", "Development"],
      "faq": [{"question": "What do you do?", "answer": "..."}],
      "timezone": "UTC",
      "operating_hours": {},
      "ai_prompt_config": {},
      "owner": "uuid-string",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/v1/businesses/`

Create a new business.

**Request:**

```json
{
  "name": "New Business",
  "industry": "Healthcare",
  "description": "Healthcare solutions",
  "services": ["Consulting", "Training"],
  "timezone": "America/New_York"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Created successfully.",
  "data": {
    "id": "uuid-string",
    "name": "New Business",
    "slug": "new-business",
    ...
  }
}
```

### GET `/api/v1/businesses/{slug}/`

Retrieve a business by its slug.

### PUT `/api/v1/businesses/{slug}/`

Update a business. Only the owner can update.

### DELETE `/api/v1/businesses/{slug}/`

Deactivate a business (soft delete). Only the owner can deactivate.

### GET `/api/v1/businesses/{slug}/ai-config/`

Get the AI prompt configuration for a business.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "ai_prompt_config": {
      "greeting": "Hello! Welcome to Acme Corp.",
      "qualification_questions": ["What is your budget?"],
      "booking_prompt": "Let me schedule a meeting for you."
    }
  }
}
```

### PUT `/api/v1/businesses/{slug}/ai-config/`

Update the AI prompt configuration. Only the owner can update.

**Request:**

```json
{
  "ai_prompt_config": {
    "greeting": "Hi there! How can we help?",
    "qualification_questions": ["What is your team size?"]
  }
}
```

---

## Lead Endpoints

### GET `/api/v1/leads/leads/`

List all leads for the current business.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status |
| `source` | string | Filter by source |
| `assigned_to` | uuid | Filter by assigned user |
| `search` | string | Search name, email, phone, company |
| `ordering` | string | Sort by field (prefix `-` for descending) |

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": {
    "count": 50,
    "total_pages": 3,
    "current_page": 1,
    "page_size": 20,
    "next": "http://localhost:8000/api/v1/leads/leads/?page=2",
    "previous": null
  },
  "results": [
    {
      "id": "uuid-string",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "company": "Acme Inc",
      "source": "website",
      "status": "new",
      "score": 0,
      "assigned_to": {
        "id": "uuid-string",
        "email": "sales@acme.com",
        "first_name": "Sales",
        "last_name": "Rep"
      },
      "tags": ["enterprise", "demo"],
      "notes": "Interested in our product",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/v1/leads/leads/`

Create a new lead.

**Request:**

```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1987654321",
  "company": "Tech Corp",
  "source": "referral",
  "status": "new",
  "score": 25,
  "notes": "Referred by John",
  "tags": ["warm-lead"]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "id": "uuid-string",
    "name": "Jane Smith",
    ...
  }
}
```

### GET `/api/v1/leads/leads/{id}/`

Retrieve a lead by ID.

### PUT `/api/v1/leads/leads/{id}/`

Update a lead.

### DELETE `/api/v1/leads/leads/{id}/`

Delete a lead.

### POST `/api/v1/leads/leads/{id}/assign/`

Assign a lead to a user.

**Request:**

```json
{
  "user_id": "uuid-string"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Lead assigned successfully",
  "data": {
    "id": "uuid-string",
    "name": "Jane Smith",
    "assigned_to": {
      "id": "uuid-string",
      "email": "sales@acme.com",
      "first_name": "Sales",
      "last_name": "Rep"
    },
    ...
  }
}
```

### PATCH `/api/v1/leads/leads/{id}/update-status/`

Update a lead's pipeline status.

**Request:**

```json
{
  "status": "contacted"
}
```

**Valid statuses:** `new`, `contacted`, `qualified`, `unqualified`, `meeting_booked`, `won`, `lost`

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Lead status updated successfully",
  "data": {
    "id": "uuid-string",
    "status": "contacted",
    ...
  }
}
```

### POST `/api/v1/leads/leads/bulk-update-status/`

Update status for multiple leads at once.

**Request:**

```json
{
  "lead_ids": ["uuid-1", "uuid-2", "uuid-3"],
  "status": "qualified"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "3 leads updated successfully",
  "data": {
    "updated_count": 3
  }
}
```

### Lead Notes

#### GET `/api/v1/leads/leads/{id}/notes/`

List all notes for a lead.

#### POST `/api/v1/leads/leads/{id}/notes/`

Create a note for a lead.

**Request:**

```json
{
  "content": "Had a great call with the lead. They are interested in our enterprise plan."
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Lead note created successfully",
  "data": {
    "id": "uuid-string",
    "lead": "uuid-string",
    "content": "Had a great call with the lead...",
    "created_by": {
      "id": "uuid-string",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

#### DELETE `/api/v1/leads/leads/{id}/notes/{note_id}/`

Delete a note from a lead.

---

## Conversation Endpoints

### GET `/api/v1/conversations/conversations/`

List all conversations for the current business.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: `active`, `paused`, `closed`, `ai_handoff` |
| `channel` | string | Filter: `web`, `email`, `sms`, `whatsapp` |
| `ai_paused` | boolean | Filter by AI pause state |
| `search` | string | Search lead name or email |

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": { ... },
  "results": [
    {
      "id": "uuid-string",
      "business": "uuid-string",
      "lead": {
        "id": "uuid-string",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "status": "active",
      "channel": "web",
      "ai_paused": false,
      "assigned_to": null,
      "last_message_at": "2026-01-01T12:00:00Z",
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T12:00:00Z"
    }
  ]
}
```

### POST `/api/v1/conversations/conversations/`

Create a new conversation.

**Request:**

```json
{
  "lead": "uuid-string",
  "channel": "web",
  "status": "active"
}
```

### GET `/api/v1/conversations/conversations/{id}/`

Retrieve a conversation with full details including recent messages.

### PUT `/api/v1/conversations/conversations/{id}/`

Update a conversation.

### Conversation Actions

#### POST `/api/v1/conversations/conversations/{id}/pause-ai/`

Pause AI auto-responses. A system message is added to the conversation.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "AI paused successfully",
  "data": {
    "id": "uuid-string",
    "ai_paused": true,
    ...
  }
}
```

#### POST `/api/v1/conversations/conversations/{id}/resume-ai/`

Resume AI auto-responses.

#### POST `/api/v1/conversations/conversations/{id}/handoff/`

Hand off conversation to the current user. Sets status to `ai_handoff`, assigns the user, and pauses AI.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Handoff successful",
  "data": {
    "id": "uuid-string",
    "status": "ai_handoff",
    "ai_paused": true,
    "assigned_to": {
      "id": "uuid-string",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    ...
  }
}
```

#### POST `/api/v1/conversations/conversations/{id}/close/`

Close a conversation.

### Messages

#### GET `/api/v1/conversations/conversations/{id}/messages/`

List all messages in a conversation.

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": { ... },
  "results": [
    {
      "id": "uuid-string",
      "conversation": "uuid-string",
      "sender_type": "lead",
      "sender_id": null,
      "content": "Hi, I'm interested in your product",
      "channel": "web",
      "is_ai_generated": false,
      "metadata": {},
      "created_at": "2026-01-01T00:00:00Z"
    },
    {
      "id": "uuid-string",
      "conversation": "uuid-string",
      "sender_type": "ai",
      "sender_id": null,
      "content": "Hello! Welcome to Acme Corp. How can I help you today?",
      "channel": "web",
      "is_ai_generated": true,
      "metadata": {},
      "created_at": "2026-01-01T00:00:01Z"
    }
  ]
}
```

#### POST `/api/v1/conversations/conversations/{id}/messages/`

Send a message in a conversation (as staff).

**Request:**

```json
{
  "content": "Thanks for reaching out! Let me connect you with our sales team."
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "uuid-string",
    "conversation": "uuid-string",
    "sender_type": "staff",
    "sender_id": "uuid-string",
    "content": "Thanks for reaching out!...",
    "channel": "web",
    "is_ai_generated": false,
    "metadata": {},
    "created_at": "2026-01-01T12:00:00Z"
  }
}
```

#### POST `/api/v1/conversations/conversations/{id}/messages/{msg_id}/mark-read/`

Mark a message as read.

---

## Agent Endpoints

### POST `/api/v1/agent/run/`

Execute the AI agent for a specific lead. The agent will analyze the lead, conversation history, and business context, then take an appropriate action.

**Request:**

```json
{
  "lead_id": "uuid-string"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Agent execution completed",
  "data": {
    "execution_id": "uuid-string",
    "status": "completed",
    "decision": "send_message",
    "tool_output": {
      "tool": "send_email",
      "to": "lead@example.com",
      "subject": "Welcome! Let's connect",
      "body_preview": "Hi there, thank you for your interest...",
      "sent_at": "2026-01-01T12:00:00Z"
    },
    "messages": [
      {
        "role": "assistant",
        "content": "Decision: send_message"
      }
    ]
  }
}
```

**Possible decisions:** `send_message`, `book_meeting`, `schedule_followup`, `update_lead_status`, `notify_sales`, `search_knowledge`, `create_note`

### GET `/api/v1/agent/executions/`

List agent execution history.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `business_id` | uuid | Filter by business |
| `lead_id` | uuid | Filter by lead |
| `status` | string | Filter: `pending`, `running`, `completed`, `failed`, `paused` |

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": { ... },
  "results": [
    {
      "id": "uuid-string",
      "lead": {
        "id": "uuid-string",
        "name": "Jane Smith"
      },
      "business": {
        "id": "uuid-string",
        "name": "Acme Corp"
      },
      "conversation": "uuid-string",
      "status": "completed",
      "input_data": {
        "lead_id": "uuid-string",
        "business_id": "uuid-string"
      },
      "output_data": {
        "decision": "send_message",
        "tool_output": { ... }
      },
      "error_message": "",
      "started_at": "2026-01-01T12:00:00Z",
      "completed_at": "2026-01-01T12:00:01Z",
      "created_at": "2026-01-01T12:00:00Z"
    }
  ]
}
```

### GET `/api/v1/agent/executions/{id}/`

Retrieve a specific agent execution.

### GET `/api/v1/agent/memories/`

List agent memories (knowledge the agent has learned).

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `business_id` | uuid | Filter by business |
| `lead_id` | uuid | Filter by lead |
| `memory_type` | string | Filter: `conversation`, `business_profile`, `customer_info`, `interaction` |

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": { ... },
  "results": [
    {
      "id": "uuid-string",
      "business": {
        "id": "uuid-string",
        "name": "Acme Corp"
      },
      "lead": {
        "id": "uuid-string",
        "name": "Jane Smith"
      },
      "memory_type": "interaction",
      "content": {
        "decision": "send_message",
        "tool_output": { ... }
      },
      "created_at": "2026-01-01T12:00:00Z",
      "updated_at": "2026-01-01T12:00:00Z"
    }
  ]
}
```

### GET `/api/v1/agent/memories/{id}/`

Retrieve a specific memory.

---

## Knowledge Base Endpoints

### GET `/api/v1/knowledge/documents/`

List all knowledge base documents for the current business.

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": { ... },
  "results": [
    {
      "id": "uuid-string",
      "business": "uuid-string",
      "title": "Product Pricing Guide",
      "file": "/media/knowledge/2026/01/pricing.pdf",
      "content": "Our pricing starts at...",
      "document_type": "pdf",
      "is_indexed": true,
      "metadata": {},
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/v1/knowledge/documents/`

Upload a knowledge base document (multipart/form-data).

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Document title |
| `file` | file | Yes | Document file (PDF, DOCX, TXT, MD) |
| `document_type` | string | Yes | One of: `pdf`, `docx`, `txt`, `md` |

### GET `/api/v1/knowledge/documents/{id}/`

Retrieve a document.

### PUT `/api/v1/knowledge/documents/{id}/`

Update a document.

### DELETE `/api/v1/knowledge/documents/{id}/`

Delete a document.

### GET `/api/v1/knowledge/documents/search/?q=query`

Search knowledge base documents by content.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": { ... },
  "results": [
    {
      "id": "uuid-string",
      "title": "Product Pricing Guide",
      "content": "...pricing details...",
      "document_type": "pdf",
      "is_indexed": true,
      ...
    }
  ]
}
```

---

## Calendar Endpoints

### Calendar Integrations

#### GET `/api/v1/calendar/integrations/`

List calendar integrations.

#### POST `/api/v1/calendar/integrations/`

Create a calendar integration.

**Request:**

```json
{
  "provider": "google",
  "credentials": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

#### POST `/api/v1/calendar/integrations/{id}/test-connection/`

Test the calendar connection.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Connection test successful",
  "data": {
    "connected": true,
    "calendar_name": "Primary Calendar"
  }
}
```

### Calendar Events

#### GET `/api/v1/calendar/events/`

List calendar events.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `start` | datetime | Filter events starting after this date |
| `end` | datetime | Filter events ending before this date |
| `status` | string | Filter: `scheduled`, `completed`, `cancelled`, `rescheduled` |

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": { ... },
  "results": [
    {
      "id": "uuid-string",
      "business": "uuid-string",
      "lead": {
        "id": "uuid-string",
        "name": "Jane Smith"
      },
      "title": "Discovery call with Jane Smith",
      "description": "Initial qualification call",
      "start_time": "2026-01-02T14:00:00Z",
      "end_time": "2026-01-02T14:30:00Z",
      "status": "scheduled",
      "external_id": "google-event-id",
      "metadata": {},
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/v1/calendar/events/`

Create a calendar event. If a calendar integration is active, the event is also created in the external calendar.

**Request:**

```json
{
  "lead": "uuid-string",
  "title": "Follow-up Meeting",
  "description": "Discuss proposal",
  "start_time": "2026-01-02T14:00:00Z",
  "end_time": "2026-01-02T14:30:00Z"
}
```

#### GET `/api/v1/calendar/events/{id}/`

Retrieve a calendar event.

#### PUT `/api/v1/calendar/events/{id}/`

Update a calendar event. Status changes are synced to the external calendar.

#### DELETE `/api/v1/calendar/events/{id}/`

Delete a calendar event.

---

## Dashboard Endpoints

### GET `/api/v1/dashboard/`

Get dashboard analytics summary.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | integer | 30 | Analysis period in days |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Success.",
  "data": {
    "date": "2026-01-01",
    "period_start": "2026-01-01",
    "period_end": "2026-01-31",
    "total_leads": 150,
    "new_leads": 25,
    "qualified_leads": 15,
    "meetings_booked": 8,
    "conversion_rate": 5.3,
    "avg_response_time": 12.5,
    "ai_interactions": 45,
    "active_conversations": 12,
    "trend": {
      "total_leads": 15.2,
      "meetings_booked": 33.3,
      "conversion_rate": -2.1
    }
  }
}
```

### GET `/api/v1/dashboard/history/`

List historical analytics snapshots.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | date | Start date (YYYY-MM-DD) |
| `end_date` | date | End date (YYYY-MM-DD) |

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": { ... },
  "results": [
    {
      "id": "uuid-string",
      "business": "uuid-string",
      "date": "2026-01-01",
      "total_leads": 150,
      "new_leads": 25,
      "qualified_leads": 15,
      "meetings_booked": 8,
      "conversion_rate": 5.3,
      "avg_response_time": 12.5,
      "ai_interactions": 45,
      "active_conversations": 12,
      "created_at": "2026-01-01T23:59:59Z"
    }
  ]
}
```

---

## Notification Endpoints

### GET `/api/v1/notifications/notifications/`

List notifications for the current user.

**Response (200 OK):**

```json
{
  "success": true,
  "pagination": { ... },
  "results": [
    {
      "id": "uuid-string",
      "user": "uuid-string",
      "business": "uuid-string",
      "title": "Lead Assigned",
      "message": "Jane Smith has been assigned to you.",
      "notification_type": "lead_assigned",
      "is_read": false,
      "link": "/leads/uuid-string",
      "metadata": {},
      "created_at": "2026-01-01T12:00:00Z"
    }
  ]
}
```

### GET `/api/v1/notifications/notifications/{id}/`

Retrieve a notification.

### POST `/api/v1/notifications/notifications/{id}/mark-read/`

Mark a single notification as read.

### POST `/api/v1/notifications/notifications/mark-all-read/`

Mark all unread notifications as read.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "5 notifications marked as read",
  "data": {
    "updated_count": 5
  }
}
```

### GET `/api/v1/notifications/notifications/unread-count/`

Get the count of unread notifications.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Success.",
  "data": {
    "unread_count": 12
  }
}
```

---

## Throttling

API rate limits:

| User Type | Rate |
|-----------|------|
| Anonymous | 100 requests/hour |
| Authenticated | 1000 requests/hour |

Exceeding the limit returns a `429 Too Many Requests` response.
