<div align="center">

# Luma

**Modern project management for all teams**

Track work items, run cycles, and manage product roadmaps — without the chaos of managing the tool itself.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE.txt)

</div>

## What is Luma?

Luma is an open-source, self-hostable project management platform for software teams. It is maintained as a fork of [Plane](https://github.com/makeplane/plane) and licensed under the [GNU AGPL-3.0](./LICENSE.txt).

### Why Luma exists

Luma keeps the feature set and AGPL lineage of Plane, but is maintained with a different set of operating defaults:

- **Data control** — run the whole stack on infrastructure you own instead of a hosted service.
- **Private by default** — instance telemetry is disabled unless an administrator enables it.
- **Low-friction local development** — the API can run with SQLite, an in-process cache, and eager Celery tasks when PostgreSQL and Redis are not available.
- **Upstream-compatible internals** — the `plane` Python module and `@plane/*` package names are intentionally preserved so upstream fixes can be followed without a fork-wide import rewrite. You will still see those names in code and package READMEs.

### Highlights

- **Work items** — Create and manage tasks with a rich text editor, file uploads, sub-properties, and cross-references between related items.
- **Cycles** — Keep team momentum with sprints (cycles), burn-down charts, and progress tracking.
- **Modules** — Break complex projects into smaller, manageable modules.
- **Views** — Build filters that surface exactly what matters, then save and share them.
- **Pages** — Capture and organize ideas with AI-assisted, collaborative rich text docs.
- **Analytics** — Real-time insights and trends across all your project data.
- **Intake / Inbox** — Triage incoming work before it lands in a project.
- **Internationalization** — Translated into multiple languages via `packages/i18n`.
- **Self-hostable** — Run the entire stack on infrastructure you control.

## Architecture

A pnpm + Turborepo monorepo:

| Path         | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `apps/web`   | Primary web application on port 3000 (React Router, MobX)  |
| `apps/admin` | Instance administration panel on port 3001 ("God mode")    |
| `apps/space` | Public-facing site on port 3002 for published work         |
| `apps/live`  | Realtime collaboration service on port 3100                |
| `apps/api`   | Django REST backend                                        |
| `apps/proxy` | Caddy reverse proxy configuration                          |
| `packages/*` | Shared types, utils, state, i18n, editor, blocks, and more |

## Technology stack

| Area               | What we use                                                                                                            | Why                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Monorepo           | pnpm 11 workspaces, Turborepo, dependency catalogs                                                                     | One install/build graph with centrally pinned versions         |
| Frontend           | TypeScript, React 19, React Router 8, MobX, Tailwind CSS 4, `@makeplane/propel`                                        | Typed apps with reactive stores and shared design primitives   |
| Collaborative docs | Tiptap/ProseMirror, Yjs, Hocuspocus (`apps/live`)                                                                      | Rich text pages with realtime collaboration                    |
| Backend            | Python 3.12, Django 5.2, Django REST Framework, Celery, Django Channels                                                | REST API, background jobs, and websocket-capable services      |
| Data and services  | PostgreSQL (SQLite fallback locally), Redis/Valkey (in-memory fallback locally), RabbitMQ, S3-compatible storage/MinIO | Production-grade services with a lighter local path            |
| Tooling and tests  | uv + ruff, pytest/pytest-django, Vitest, oxlint/oxfmt, TypeScript, Husky/lint-staged                                   | Reproducible Python deps and fast checks across both languages |

## Quick start

Requirements: [Node.js 22+](https://nodejs.org/) (see `.node-version`), pnpm (enabled automatically via `corepack`), and Python 3.12 with [uv](https://docs.astral.sh/uv/). **12 GB RAM** is recommended.

1. **Prepare the environment**

   ```bash
   ./setup.sh
   ```

   This copies every `.env.example` into place, generates a Django `SECRET_KEY` and object-storage credentials, installs Node dependencies, and bootstraps the API database (migrations, instance registration, and default auth config).

2. **Start the API**

   ```bash
   cd apps/api
   uv sync
   uv run python manage.py migrate --noinput
   uv run python manage.py register_instance local-machine
   uv run python manage.py configure_instance
   uv run python manage.py runserver 0.0.0.0:8000
   ```

   The bootstrap commands are safe to rerun. If `setup.sh` could not bootstrap the database, run them once manually.

3. **Start the web apps**

   From the repository root:

   ```bash
   pnpm dev
   ```

4. **Set up your instance**

   Register yourself as the instance admin at <http://localhost:3001/god-mode/>, then sign in at <http://localhost:3000> with the same credentials.

A minimal local API path is available without PostgreSQL and Redis. Set `DATABASE_URL=sqlite:///db.sqlite3` in `apps/api/.env` and leave `REDIS_URL` unset; the API then falls back to an in-memory cache and runs Celery tasks eagerly. Install and run PostgreSQL, Valkey/Redis, RabbitMQ, and MinIO yourself when you need integration or production-shaped testing.

## Common commands

Run from the repository root:

| Command       | Description                                   |
| ------------- | --------------------------------------------- |
| `pnpm dev`    | Start web, admin, space, and live dev servers |
| `pnpm build`  | Build all packages and apps                   |
| `pnpm check`  | Run all checks (format, lint, types)          |
| `pnpm fix`    | Auto-fix format and lint issues               |
| `pnpm doctor` | Run the React diagnostics playbook            |

## Testing

From the repository root, with `./setup.sh` already run:

```bash
cd apps/api
uv sync
uv run pytest
```

For focused unit runs:

```bash
uv run pytest -m unit
```

See [apps/api/tests/RUNNING_TESTS.md](./apps/api/tests/RUNNING_TESTS.md) for the full walkthrough.

## Documentation

- [Contributing guide](./CONTRIBUTING.md)
- [Agent development guide](./AGENTS.md)
- [Linting](./docs/linting.md)
- [API test layout](./apps/api/plane/tests/README.md)
- [API testing guide](./apps/api/plane/tests/TESTING_GUIDE.md)

## Acknowledgements and license

Luma is a fork of [Plane](https://github.com/makeplane/plane) by Plane Software Inc. and its contributors. Huge thanks to them and to everyone who built the upstream project.

Per the AGPL-3.0, the original copyright headers in source files are preserved, and this project is licensed under the [GNU Affero General Public License v3.0](./LICENSE.txt).
