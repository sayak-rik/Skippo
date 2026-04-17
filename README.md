# Skippo

Unified school operations platform — transport tracking, academics, compliance, and communications across five surfaces: **Parent App**, **Driver App**, **Teacher App**, **Admin Dashboard**, and **Backend API**.

> All apps run in **demo mode**. No real database writes happen for the app flows — the backend serves from an in-memory state store that resets on restart. Migrations and the Postgres container are still required for Django's internals (sessions, admin, etc.).

---

## Architecture

| Surface | Tech | Port |
|---|---|---|
| Backend API | Django 5 + DRF + Daphne (ASGI) | 8000 |
| Marketing Website | Next.js 14 + Tailwind | 3001 |
| Admin Dashboard | Next.js 14 | 3000 |
| Parent App | Expo (React Native Web) | 8081 |
| Driver App | Expo (React Native Web) | 8082 |
| Teacher App | Expo (React Native Web) | 8083 |
| PostgreSQL | postgres:16-alpine | 5432 |
| Redis | redis:7-alpine | 6379 |

---

## Running the full stack

```bash
# From the repo root
docker compose up --build
```

All services start in dependency order. The backend waits for Postgres and Redis health checks before running migrations and starting Daphne.

To run only the infrastructure (Postgres + Redis + backend) without the frontends:

```bash
docker compose up --build postgres redis backend backend-worker backend-beat
```

---

## Accessing the apps

Once the stack is up:

| App | URL | Notes |
|---|---|---|
| Backend API | http://localhost:8000 | REST API + health check |
| Health check | http://localhost:8000/health/ | Returns `{"status":"ok"}` |
| Marketing Website | http://localhost:3001 | Landing page, school signup, contact |
| Admin Dashboard | http://localhost:3000 | Next.js |
| Parent App | http://localhost:8081 | Expo Web |
| Driver App | http://localhost:8082 | Expo Web |
| Teacher App | http://localhost:8083 | Expo Web |
| Django Admin | http://localhost:8000/admin/ | Standard Django admin |
| API Schema | http://localhost:8000/api/schema/ | OpenAPI (drf-spectacular) |

---

## Demo credentials

All login flows use OTP simulation — any 6-digit code is accepted.

| Role | Phone / identifier | Token (internal) |
|---|---|---|
| Parent | Any phone number | `demo-parent-token` |
| Driver (existing) | Any phone number | `demo-driver-token` |
| Teacher (existing) | Any phone number | `demo-teacher-token` |
| Driver invite token | `demo-driver-invite-2026` | — |
| Teacher invite token | `demo-invite-2026` | — |

Demo school slug: `greenfield-public-school`

---

## Dry-testing individual apps

### Backend API

```bash
# Health check
curl http://localhost:8000/health/

# Parent login
curl -s -X POST http://localhost:8000/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","otp":"123456","role":"parent"}' | jq

# Driver login
curl -s -X POST http://localhost:8000/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","otp":"123456","role":"driver"}' | jq

# Teacher login
curl -s -X POST http://localhost:8000/api/auth/demo-login/ \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","otp":"123456","role":"teacher"}' | jq
```

All authenticated endpoints accept `Authorization: Bearer <any-string>` — the demo views bypass JWT validation.

---

### Parent App (http://localhost:8081)

**Login flow**
1. Open the app → tap any phone number field, enter anything → tap **Send OTP** → enter any 6-digit code → tap **Verify**.

**New parent signup (3-step)**
1. From Login, tap **New parent? Create your account →**
2. Step 1 — enter phone + OTP (any values).
3. Step 2 — enter child name and grade.
4. Step 3 — pick a bus route from the list (North Route A / South Route B / East Route C) → tap **Confirm & finish**.

**Home screen**
- Shows the live ETA badge, trip status pill, and bus label for the active trip.
- Scroll down to see the latest alerts and the driver contact card.

**Live tracking (Track tab)**
- Map updates every 60 seconds via the `/api/tracking/trips/{id}/ping/` endpoint.
- The **LIVE** badge appears when the trip is active.
- Tap the **Call** button on the driver card to initiate a phone call.

**Driver contact (Profile tab)**
- Tap **Call driver** to reach the driver at any time, even when no trip is active.

**Change bus route (Profile tab)**
- Tap **Change bus route** → pick a different route from the modal → tap **Switch to this route**.

**Edit pickup/drop stop (Profile tab)**
- Tap **Edit stop** → type a new stop name → tap **Save stop**.
- The driver's Roster screen will show a **📍 Parent set a custom stop** badge for that student.

**Notifications tab**
- Shows live alerts (boarding confirmations, breakdown warnings, missed-drop alerts, SOS events).

---

### Driver App (http://localhost:8082)

**Login — existing driver**
1. Enter any phone number → any OTP → tap **Verify** → app opens on the Dashboard.

**Login — invite signup**
1. From Login, tap **Sign up as a driver**.
2. Choose **I have an invite code**.
3. Enter token `demo-driver-invite-2026` → tap **Validate token** → fills school name automatically.
4. Step 2 — fill name, phone, Aadhaar (any values) → tap **Complete signup** → app opens directly (no approval wait).

**Login — self-signup (pending approval)**
1. From Login, tap **Sign up as a driver**.
2. Choose **Self-register (needs approval)**.
3. Step 1 — pick a school from the list.
4. Step 2 — fill profile details + vehicle registration.
5. App lands on **Pending Approval** screen showing the request ID.
6. Tap **Check approval status** to simulate admin approval → app unlocks immediately.

**Dashboard tab**
- Start trip → status changes to **ACTIVE**, GPS ping dot turns green, floating **SOS** button appears.
- If the driver has multiple vehicles assigned, a **Switch vehicle** button appears on the vehicle card → tap to see the picker.
- End trip → saves a trip record to `tripHistory` in demo state.

**Roster tab**
- Shows all students with status chips (ABSENT / BOARDED / DROPPED).
- Tap **Board** / **Drop** to update student status.
- Students with a parent-set custom stop show a **📍 Parent set a custom stop** badge.

**SOS tab (Emergency Controls)**
- Tap **Trigger SOS** → full-screen red overlay appears with step-by-step instructions; all parents receive a critical alert. Tap **Dismiss alert screen** to close.
- Tap **Report Breakdown** → opens the Breakdown screen.

**Breakdown screen**
- Tap **Alert all parents now** → parents receive a warning-level alert; confirmation card appears.
- Scroll down to see nearby school vehicles with **Call** buttons.

**Floating SOS button**
- When a trip is active, a red **SOS** button floats above the tab bar on all screens.
- Tap it from any tab to trigger SOS without navigating away.

**Devices tab**
- Shows linked devices (tied to the driver's Aadhaar). Multiple devices are supported.

**Renewals tab**
- Shows upcoming document renewals (fitness certificate, insurance, etc.) with urgency levels.

---

### Teacher App (http://localhost:8083)

**Login — existing teacher**
1. Enter any phone number → any OTP → app opens. If `is_first_week` is `true` (default), the class-picker setup screen is shown first.

**First-week setup (class picker)**
1. On the setup screen, pick one or more classrooms from the list.
2. Configure your availability for Monday–Friday.
3. Tap **Save my schedule** → schedule preferences are saved; app proceeds to the main tabs.

**Login — invite signup**
1. From Login, tap **Join with invite**.
2. Enter token `demo-invite-2026` → fills school and email automatically.
3. Enter name and confirm → app opens.

**Schedule tab**
- Shows today's sessions. The current session is highlighted.
- Tap a session to open the attendance roster for that class.

**Attendance roster**
- Mark students present or absent.
- Add a comment per student.
- Tap **Save attendance** to submit.

**Broadcast tab**
- Tap **New broadcast** → enter a message → select target classrooms → tap **Send**.
- Sent broadcasts appear in the list with delivery timestamps.

**Assist Requests tab**
- Lists pending parent questions per student.
- Tap a request to open the reply modal → type a response → tap **Reply**.
- Resolved requests are marked with a green check.

---

### Admin Dashboard (http://localhost:3000)

The Next.js dashboard connects to the backend at `http://localhost:8000`. Navigate the UI normally — all data is served from the same in-memory demo state as the mobile apps.

---

## Running apps locally without Docker

### Backend

```bash
cd backend
pip install -r requirements/dev.txt

# Requires a running Postgres and Redis (or use docker compose up postgres redis)
export DATABASE_URL=postgresql://skippo:skippo@localhost:5432/skippo
export REDIS_URL=redis://localhost:6379/0
export DJANGO_SETTINGS_MODULE=skippo_backend.settings.local
export PYTHONPATH=src

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Parent / Driver / Teacher apps

```bash
cd mobile/parent-app   # or driver-app / teacher-app
npm install
npm run web            # opens Expo Web on http://localhost:8081
```

### Dashboard

```bash
cd dashboard
npm install
npm run dev            # opens Next.js on http://localhost:3000
```

---

## Resetting demo state

The in-memory state resets automatically on every backend container restart:

```bash
docker compose restart backend
```

To selectively reset only the backend without rebuilding images:

```bash
docker compose stop backend && docker compose start backend
```

---

## Environment variables

The backend reads from environment variables with safe defaults for local development. No `.env` file is required for the Docker compose setup — all values are set inline in `docker-compose.yml`.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://skippo:skippo@localhost:5432/skippo` | Postgres DSN |
| `REDIS_URL` | `redis://localhost:6379/0` | Cache + channel layer |
| `CELERY_BROKER_URL` | `redis://localhost:6379/1` | Celery task queue |
| `DJANGO_SECRET_KEY` | `insecure-dev-key` | Django secret (change in prod) |
| `DJANGO_DEBUG` | `False` | Debug mode |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `GOOGLE_MAPS_API_KEY` | _(empty)_ | Optional — maps fall back to static mock data |
