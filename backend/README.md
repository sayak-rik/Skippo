# Skippo Backend

This backend is structured as a long-term Django platform for:

- multi-tenant school operations
- high write concurrency with PostgreSQL
- real-time transport tracking through Channels + Redis
- background processing through Celery
- strongly separated domain modules for maintainability

## Structure

- `src/skippo_backend/`: project configuration, settings, ASGI/WSGI, Celery bootstrap
- `src/apps/`: domain modules such as `accounts`, `transport`, `tracking`, `academics`
- `src/common/`: shared primitives, base models, middleware, utilities
- `src/integrations/`: external service adapters
- `compose/`: container entrypoints for web, worker, and beat
- `requirements/`: Python dependency sets

## Domain Principles

- Each domain app owns its models, services, selectors, tasks, and API layer.
- Cross-domain orchestration should happen through explicit services and tasks.
- Tenant scoping should be enforced in middleware, managers, services, and tests.
- PostgreSQL is the system of record; Redis supports realtime and async workloads.
