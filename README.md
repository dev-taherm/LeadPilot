# LeadFlow AI

**AI-Powered Multi-Tenant Lead Follow-Up Platform**

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

LeadFlow AI is a multi-tenant lead management and automated follow-up platform powered by AI agents. It enables businesses to capture, qualify, and convert leads through intelligent conversations powered by LangGraph-based AI agents. The platform supports multi-channel communication, calendar integrations, knowledge base management, and real-time analytics.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                       │
│   Dashboard │ Leads │ Conversations │ Calendar │ Analytics      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST API (JWT Auth)
┌──────────────────────────▼──────────────────────────────────────┐
│                     Backend (Django + DRF)                       │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐ │
│  │   Auth   │ │  Leads   │ │Convos/Msgs │ │  Knowledge Base  │ │
│  └──────────┘ └──────────┘ └────────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐ │
│  │Calendar  │ │Analytics │ │Notifications│ │  AI Agent Engine │ │
│  └──────────┘ └──────────┘ └────────────┘ └──────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
   ┌─────▼─────┐   ┌──────▼──────┐  ┌──────▼──────┐
   │ PostgreSQL │   │    Redis    │  │  LLM (API)  │
   │  (Data)    │   │  (Celery)  │  │ OpenAI/Local │
   └───────────┘   └─────────────┘  └─────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Zustand, Recharts |
| **Backend** | Django 4.2+, Django REST Framework, SimpleJWT, django-filter |
| **AI Engine** | LangChain, LangGraph, OpenAI / Local LLM (Ollama) |
| **Task Queue** | Celery + Redis |
| **Database** | PostgreSQL (production) / SQLite (development) |
| **Auth** | JWT (access + refresh tokens, token blacklisting) |

### Multi-Tenant Design

Every model includes a `business` foreign key. A `TenantMiddleware` extracts the `business_id` from the JWT and attaches it to `request.tenant`. All ViewSets use `TenantAccessMixin` to automatically scope queries to the authenticated user's business, ensuring complete data isolation between tenants.

---

## Project Structure

```
ai-lead-follow-up/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── scripts/
│
├── backend/
│   ├── Dockerfile
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   ├── apps/
│   │   ├── common/
│   │   │   ├── exceptions.py
│   │   │   ├── fields.py
│   │   │   ├── logging.py
│   │   │   ├── middleware.py
│   │   │   ├── mixins.py
│   │   │   ├── models.py
│   │   │   ├── pagination.py
│   │   │   ├── responses.py
│   │   │   └── tokens.py
│   │   ├── users/
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── managers.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   ├── businesses/
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   ├── leads/
│   │   │   ├── filters.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   ├── conversations/
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   ├── agent/
│   │   │   ├── admin.py
│   │   │   ├── agent.py
│   │   │   ├── apps.py
│   │   │   ├── graph.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── state.py
│   │   │   ├── tools.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   ├── knowledge/
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   ├── utils.py
│   │   │   └── views.py
│   │   ├── calendar_integration/
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── providers/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   └── google.py
│   │   │   ├── serializers.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   ├── analytics/
│   │   │   ├── admin.py
│   │   │   ├── apps.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   ├── tasks.py
│   │   │   ├── urls.py
│   │   │   └── views.py
│   │   └── notifications/
│   │       ├── admin.py
│   │       ├── apps.py
│   │       ├── models.py
│   │       ├── serializers.py
│   │       ├── urls.py
│   │       └── views.py
│   ├── media/
│   ├── static/
│   └── templates/
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── eslint.config.mjs
    ├── postcss.config.mjs
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   ├── not-found.tsx
        │   ├── globals.css
        │   ├── login/
        │   ├── register/
        │   ├── dashboard/
        │   ├── leads/
        │   ├── conversations/
        │   ├── calendar/
        │   ├── analytics/
        │   ├── knowledge-base/
        │   ├── ai-settings/
        │   ├── profile/
        │   └── team/
        ├── components/
        ├── hooks/
        ├── lib/
        │   ├── api.ts
        │   ├── auth.ts
        │   └── utils.ts
        ├── stores/
        │   ├── authStore.ts
        │   ├── conversationStore.ts
        │   ├── leadStore.ts
        │   └── notificationStore.ts
        └── types/
            └── index.ts
```

---

## Prerequisites

- **Python** 3.10+
- **Node.js** 20+
- **Redis** (required for Celery task queue)
- **PostgreSQL** (optional, SQLite for development)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/ai-lead-follow-up.git
cd ai-lead-follow-up
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Backend Setup

```bash
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate
python manage.py seed_data        # seed demo data (optional)
python manage.py createsuperuser  # create admin user
python manage.py runserver
```

The backend runs at `http://localhost:8000`.

### 4. Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

The frontend runs at `http://localhost:3000`.

### 5. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1/ |
| Django Admin | http://localhost:8000/admin/ |

---

## API Documentation

All endpoints are prefixed with `/api/v1/`. Authentication uses JWT Bearer tokens.

### Auth (`/api/v1/auth/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register/` | Register a new user | No |
| POST | `/login/` | Obtain JWT tokens | No |
| POST | `/logout/` | Blacklist refresh token | Yes |
| POST | `/refresh/` | Refresh access token | No |
| GET | `/profile/` | Get current user profile | Yes |
| PUT | `/profile/` | Update profile | Yes |
| POST | `/change-password/` | Change password | Yes |
| POST | `/password-reset/` | Request password reset | No |

### Businesses (`/api/v1/businesses/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | List businesses | Yes |
| POST | `/` | Create business | Yes |
| GET | `/{slug}/` | Retrieve business | Yes |
| PUT | `/{slug}/` | Update business | Yes |
| DELETE | `/{slug}/` | Deactivate business | Yes |
| GET | `/{slug}/ai-config/` | Get AI prompt config | Yes |
| PUT | `/{slug}/ai-config/` | Update AI prompt config | Yes |

### Leads (`/api/v1/leads/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/leads/` | List leads (filtered) | Yes |
| POST | `/leads/` | Create lead | Yes |
| GET | `/leads/{id}/` | Retrieve lead | Yes |
| PUT | `/leads/{id}/` | Update lead | Yes |
| DELETE | `/leads/{id}/` | Delete lead | Yes |
| POST | `/leads/{id}/assign/` | Assign lead to user | Yes |
| PATCH | `/leads/{id}/update-status/` | Update lead status | Yes |
| POST | `/leads/bulk-update-status/` | Bulk update lead statuses | Yes |
| GET | `/leads/{id}/notes/` | List lead notes | Yes |
| POST | `/leads/{id}/notes/` | Create lead note | Yes |
| DELETE | `/leads/{id}/notes/{note_id}/` | Delete lead note | Yes |

### Conversations (`/api/v1/conversations/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/conversations/` | List conversations | Yes |
| POST | `/conversations/` | Create conversation | Yes |
| GET | `/conversations/{id}/` | Retrieve conversation | Yes |
| PUT | `/conversations/{id}/` | Update conversation | Yes |
| DELETE | `/conversations/{id}/` | Delete conversation | Yes |
| POST | `/conversations/{id}/pause-ai/` | Pause AI responses | Yes |
| POST | `/conversations/{id}/resume-ai/` | Resume AI responses | Yes |
| POST | `/conversations/{id}/handoff/` | Handoff to human | Yes |
| POST | `/conversations/{id}/close/` | Close conversation | Yes |
| GET | `/conversations/{id}/messages/` | List messages | Yes |
| POST | `/conversations/{id}/messages/` | Send message | Yes |
| POST | `/conversations/{id}/messages/{msg_id}/mark-read/` | Mark read | Yes |

### AI Agent (`/api/v1/agent/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/run/` | Execute agent for a lead | Yes |
| GET | `/executions/` | List agent executions | Yes |
| GET | `/executions/{id}/` | Retrieve execution | Yes |
| GET | `/memories/` | List agent memories | Yes |
| GET | `/memories/{id}/` | Retrieve memory | Yes |

### Knowledge Base (`/api/v1/knowledge/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/documents/` | List documents | Yes |
| POST | `/documents/` | Upload document | Yes |
| GET | `/documents/{id}/` | Retrieve document | Yes |
| PUT | `/documents/{id}/` | Update document | Yes |
| DELETE | `/documents/{id}/` | Delete document | Yes |
| GET | `/documents/search/?q=` | Search documents | Yes |

### Calendar (`/api/v1/calendar/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/integrations/` | List calendar integrations | Yes |
| POST | `/integrations/` | Create integration | Yes |
| GET | `/integrations/{id}/` | Retrieve integration | Yes |
| PUT | `/integrations/{id}/` | Update integration | Yes |
| DELETE | `/integrations/{id}/` | Delete integration | Yes |
| POST | `/integrations/{id}/test-connection/` | Test connection | Yes |
| GET | `/events/` | List events | Yes |
| POST | `/events/` | Create event | Yes |
| GET | `/events/{id}/` | Retrieve event | Yes |
| PUT | `/events/{id}/` | Update event | Yes |
| DELETE | `/events/{id}/` | Delete event | Yes |

### Dashboard (`/api/v1/dashboard/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get dashboard analytics | Yes |
| GET | `/history/` | List analytics snapshots | Yes |

### Notifications (`/api/v1/notifications/`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notifications/` | List notifications | Yes |
| GET | `/notifications/{id}/` | Retrieve notification | Yes |
| POST | `/notifications/{id}/mark-read/` | Mark as read | Yes |
| POST | `/notifications/mark-all-read/` | Mark all as read | Yes |
| GET | `/notifications/unread-count/` | Get unread count | Yes |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DJANGO_SECRET_KEY` | `django-insecure-dev-key...` | Django secret key |
| `DJANGO_DEBUG` | `True` | Debug mode |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | Allowed hosts |
| `DATABASE_URL` | `sqlite:///db.sqlite3` | Database connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis URL |
| `CELERY_BROKER_URL` | `redis://localhost:6379/1` | Celery broker |
| `CELERY_RESULT_BACKEND` | `redis://localhost:6379/2` | Celery result backend |
| `JWT_ACCESS_TOKEN_LIFETIME_MINUTES` | `15` | Access token lifetime |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7` | Refresh token lifetime |
| `AI_PROVIDER` | `mock` | AI provider (`mock`, `openai`) |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI base URL |
| `LOCAL_LLM_URL` | `http://localhost:11434/v1` | Local LLM URL (Ollama) |
| `LOCAL_LLM_MODEL` | `llama3` | Local LLM model name |
| `EMAIL_BACKEND` | `console` | Email backend |
| `GOOGLE_CALENDAR_CLIENT_ID` | - | Google Calendar OAuth client ID |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | - | Google Calendar OAuth secret |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `http://localhost:8000/api/v1/calendar/callback/` | OAuth redirect URI |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for CORS |

---

## Docker

Run the entire stack with Docker Compose:

```bash
cp .env.example .env
# Edit .env with production values

docker-compose up --build
```

Services:

| Service | Port | Description |
|---------|------|-------------|
| `db` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis cache & broker |
| `backend` | 8000 | Django API |
| `celery_worker` | - | Celery task worker |
| `celery_beat` | - | Celery periodic scheduler |
| `frontend` | 3000 | Next.js frontend |

---

## Testing

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=apps --cov-report=term-missing

# Run specific app tests
pytest apps/leads/tests/
pytest apps/conversations/tests/
pytest apps/agent/tests/
```

---

## AI Agent

The AI agent is built with **LangGraph** and follows a graph-based state machine pattern.

### Agent Flow

```
load_lead → load_business → load_history → load_memory → decide_action
                                                              │
                                                     ┌───────┴───────┐
                                                     │               │
                                                call_tool        finish
                                                     │
                                                save_output → finish
```

### Supported Tools

| Tool | Description |
|------|-------------|
| `send_email` | Send email to lead |
| `book_meeting` | Create calendar event |
| `schedule_followup` | Schedule a delayed follow-up via Celery |
| `update_lead_status` | Change lead pipeline status |
| `notify_sales` | Send notification to business owner |
| `search_knowledge` | Search knowledge base documents |
| `create_note` | Add a note to a lead |

### Mock Mode

Set `AI_PROVIDER=mock` to run without an LLM. The agent uses a rule-based system that simulates qualification conversations, assigns scores, and books meetings based on configurable thresholds. This is useful for development and testing.

---

## Development

### Code Conventions

- **Python**: PEP 8, type hints where practical
- **TypeScript**: ESLint + Prettier defaults
- **Git**: Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)

### Pull Request Process

1. Create a feature branch from `main`
2. Write or update tests for your changes
3. Ensure all tests pass: `pytest`
4. Run linter: `ruff check .`
5. Submit PR with clear description

---

## License

MIT License. See [LICENSE](LICENSE) for details.
