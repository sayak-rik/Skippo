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
