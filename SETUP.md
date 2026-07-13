# Skippo — System Setup

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine + Compose plugin)
- Docker Compose v2.20+ (`docker compose version`)

---

## Services overview

| Service | Profile | Port | Description |
|---|---|---|---|
| `postgres` | *(always)* | 5432 | Primary database |
| `redis` | *(always)* | 6379 | Cache / Celery broker / channel layer |
| `backend` | `backend` | 8000 | Django 5 + DRF API |
| `backend-worker` | `backend` | — | Celery worker |
| `backend-beat` | `backend` | — | Celery beat scheduler |
| `sms-service` | `backend` | 8090 | MSG91 SMS gateway |
| `email-service` | `backend` | 8092 | SMTP email gateway |
| `call-agent` | `backend` | 8091 | Plivo + OpenAI call agent |
| `llm-service` | `backend` | 8093 | LLM gateway (Gemini/OpenAI/Anthropic) |
| `exam-loadbalancer` | `backend` | 8094 | Exam pod orchestrator (+ `exam-lb-worker`, `exam-lb-beat`) |
| `ai-teacher-loadbalancer` | `backend` | 8095 | AI teacher pod orchestrator (+ `ai-teacher-lb-worker`, `ai-teacher-lb-beat`) |
| `dashboard` | `frontend` | 3000 | Admin dashboard (Next.js) |
| `website` | `frontend` | 3001 | Marketing website (Next.js) |
| `parent-app` | `mobile` | 8081 | Parent Expo app (web) |
| `driver-app` | `mobile` | 8082 | Driver Expo app (web) |
| `teacher-app` | `mobile` | 8083 | Teacher Expo app (web) |

`postgres` and `redis` have **no profile** — they start with every command.

---

## Starting the stack

### Everything at once

```bash
docker compose --profile backend --profile frontend --profile mobile up -d
```

### By layer

```bash
# Infra only (postgres + redis)
docker compose up -d

# Backend stack
docker compose --profile backend up -d

# Frontend (dashboard + website)
docker compose --profile frontend up -d

# Mobile apps
docker compose --profile mobile up -d
```

### Typical dev workflow — backend + one frontend surface

```bash
# API + dashboard
docker compose --profile backend --profile frontend up -d

# API + mobile apps
docker compose --profile backend --profile mobile up -d
```

> **Note:** `dashboard` and mobile apps read `SKIPPO_API_URL / NEXT_PUBLIC_API_URL=http://localhost:8000`.
> Start the `backend` profile before (or together with) `frontend` / `mobile`.

---

## Working with a single service

```bash
# Start a specific service (and its dependencies)
docker compose up -d <service>

# Rebuild image and restart
docker compose up -d --force-recreate --build <service>

# Tail logs
docker compose logs -f <service>

# Open a shell inside a running container
docker compose exec <service> sh
```

Common single-service rebuilds:

```bash
docker compose up -d --force-recreate --build backend
docker compose up -d --force-recreate --build dashboard
docker compose up -d --force-recreate --build parent-app
```

---

## Database operations

```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py create_skippo_superuser

# Open psql
docker compose exec postgres psql -U skippo -d skippo
```

### Loadbalancer databases (existing installs only)

The SQL files in `databases/postgres/init/` run **only when the postgres volume is
first created**. If your volume predates the exam / AI-teacher loadbalancers, create
their databases once by hand:

```bash
docker compose exec postgres psql -U skippo -d skippo -c "CREATE USER exam_lb WITH PASSWORD 'exam_lb';"
docker compose exec postgres psql -U skippo -d skippo -c "CREATE DATABASE exam_lb OWNER exam_lb;"
docker compose exec postgres psql -U skippo -d skippo -c "CREATE USER ai_teacher_lb WITH PASSWORD 'ai_teacher_lb';"
docker compose exec postgres psql -U skippo -d skippo -c "CREATE DATABASE ai_teacher_lb OWNER ai_teacher_lb;"
```

(Fresh installs — or `down --volumes` — get these automatically. Both loadbalancer
containers run their own `manage.py migrate` on boot.)

---

## Exam / AI-teacher pods — local vs cloud (`POD_PROVIDER`)

The two loadbalancers can start engine pods in two ways:

| `POD_PROVIDER` | What happens |
|---|---|
| `docker` *(compose default)* | Pods start as containers **on the local Docker daemon**, join `skippo-network`, and publish port 8080 on a random host port. No cloud account needed. |
| `fly` *(production)* | Pods start as Fly.io Machines via the Machines API (`FLY_API_TOKEN`, `FLY_*_APP_NAME`, `FLY_*_BASE_URL` required). |

For local mode, build the engine images once:

```bash
docker build -t skippo-exam-engine:local ./exam-engine
docker build -t skippo-ai-teacher:local ./ai-teacher-engine
```

The loadbalancer + worker containers mount `/var/run/docker.sock` so they can
manage pod containers. Pod URLs are built as `http://localhost:<random-port>`
(override the hostname with `DOCKER_POD_HOST` if testing from another device).

To switch to Fly.io, set in `.env`:

```env
POD_PROVIDER=fly
FLY_API_TOKEN=...
FLY_EXAM_BASE_URL=https://skippo-exam-engine.fly.dev
FLY_AI_TEACHER_BASE_URL=https://skippo-ai-teacher.fly.dev
BACKEND_PUBLIC_URL=https://api.your-domain.com   # pods must reach the webhooks
```

---

## Stopping the stack

```bash
# Stop containers, keep volumes
docker compose --profile backend --profile frontend --profile mobile down

# Stop and wipe postgres + redis data
docker compose --profile backend --profile frontend --profile mobile down --volumes
```

To reset only the backend in-memory demo state (no data wipe):

```bash
docker compose restart backend
```

---

## Environment variables

No `.env` file is required for local development — all defaults are set inline in `docker-compose.yml`.

Override any value by creating a `.env` file in the repo root:

```env
MSG91_AUTH_KEY=your-key
MSG91_TEMPLATE_ID=your-template
EMAIL_SERVICE_API_KEY=some-secret
SMTP_USER=you@gmail.com
SMTP_PASSWORD=app-password
PLIVO_AUTH_ID=your-id
PLIVO_AUTH_TOKEN=your-token
OPENAI_API_KEY=sk-...
```

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://skippo:skippo@postgres:5432/skippo` | Postgres DSN |
| `REDIS_URL` | `redis://redis:6379/0` | Cache + channel layer |
| `CELERY_BROKER_URL` | `redis://redis:6379/1` | Celery broker |
| `CELERY_RESULT_BACKEND` | `redis://redis:6379/2` | Celery results |
| `DJANGO_SECRET_KEY` | `insecure-dev-key` | Change in production |
| `DJANGO_DEBUG` | `True` | Debug mode |
| `SMS_DRY_RUN` | `true` | Suppress real SMS sends |
| `EMAIL_DRY_RUN` | `true` | Suppress real email sends |
| `CALL_AGENT_BASE_URL` | `http://localhost:8091` | Public base URL for Plivo webhooks |
| `GEMINI_API_KEY` | *(empty)* | LLM gateway + proctoring vision (set in `.env`) |
| `SMTP_PASSWORD` | *(empty)* | Gmail app password for email-service (set in `.env`) |
| `EXAM_LB_SECRET` | *(empty)* | Bearer secret: backend ↔ exam-loadbalancer ↔ exam pods |
| `EXAM_WEBHOOK_SECRET` | *(empty)* | Verifies exam-engine → backend results webhook |
| `AITLB_SECRET` | *(empty)* | Bearer secret: backend ↔ ai-teacher-loadbalancer ↔ pods |
| `AI_TEACHER_WEBHOOK_SECRET` | *(empty)* | Verifies ai-teacher-engine → backend webhook |
| `BACKEND_PUBLIC_URL` | `http://backend:8000` | URL engine pods use to reach the backend webhooks — must be **publicly reachable** when pods run on Fly.io |
| `POD_PROVIDER` | `docker` (compose) / `fly` (settings) | How exam/AI-teacher pods are launched — see the pods section above |
| `DIGILOCKER_CLIENT_ID` / `DIGILOCKER_CLIENT_SECRET` | *(empty)* | DigiLocker partner OAuth credentials; empty → driver KYC runs in mock mode (auto-approve, clearly marked) |
| `DIGILOCKER_REDIRECT_URI` | `{BACKEND_PUBLIC_URL}/api/compliance/digilocker/callback/` | OAuth redirect registered with DigiLocker |
| `FLY_API_TOKEN` | *(empty)* | Fly.io Machines API token (required to spawn exam / AI-teacher pods) |
| `FLY_EXAM_BASE_URL` / `FLY_AI_TEACHER_BASE_URL` | *(empty)* | Public base URL of the deployed Fly apps — pod URLs are built from these |

> ⚠ **Empty webhook/LB secrets disable auth on those endpoints** (dev convenience).
> Before any real deployment set all four secrets (`openssl rand -hex 32`) and
> rotate the Gemini API key + Gmail app password that were previously committed
> to git history in `docker-compose.yml`.

---

## Checking service health

```bash
# All running containers
docker compose ps

# Backend health
curl http://localhost:8000/health/

# Redis
docker compose exec redis redis-cli ping
```
