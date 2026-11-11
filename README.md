<div align="center">

# Luma

**Modern project management for all teams**

Track work items, run cycles, and manage product roadmaps — without the chaos of managing the tool itself.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE.txt)

</div>

## ✨ What is Luma?

Luma is an open-source, self-hostable project management platform for software teams. It is maintained as a fork of [Plane](https://github.com/makeplane/plane) and licensed under the [GNU AGPL-3.0](./LICENSE.txt).

### Highlights

- **Work items** — Create and manage tasks with a rich text editor, file uploads, sub-properties, and cross-references between related items.
- **Cycles** — Keep team momentum with sprints (cycles), burn-down charts, and progress tracking.
- **Modules** — Break complex projects into smaller, manageable modules.
- **Views** — Build filters that surface exactly what matters, then save and share them.
- **Pages** — Capture and organize ideas with AI-assisted, collaborative rich text docs.
- **Analytics** — Real-time insights and trends across all your project data.
- **Intake / Inbox** — Triage incoming work before it lands in a project.
- **Internationalization** — Translated into multiple languages via `packages/i18n`.
- **Self-hostable** — Run the entire stack on your own infrastructure with Docker.

## 🏗️ Architecture

A pnpm + Turborepo monorepo:

| Path               | Description                                              |
| ------------------ | -------------------------------------------------------- |
| `apps/web`         | Primary web application (React Router, MobX)             |
| `apps/admin`       | Instance administration panel ("God mode")              |
| `apps/space`       | Public-facing site for published work                    |
| `apps/live`        | Realtime collaboration service                           |
| `apps/api`         | Django REST backend                                      |
| `apps/proxy`       | Reverse proxy for the self-hosted stack                  |
| `packages/*`       | Shared types, utils, state, i18n, editor, blocks, and more |

## 🚀 Quick start (self-hosting with Docker)

Requirements: Docker Engine installed and running, and **12 GB RAM** recommended.

1. **Prepare the environment**

   ```bash
   ./setup.sh
   ```

   This copies every `.env.example` into place, generates a Django `SECRET_KEY` and object-storage credentials, and installs Node dependencies.

2. **Start the stack**

   ```bash
   docker compose up -d
   ```

3. **Set up your instance**

   Open `http://localhost` (or the port set via `LISTEN_HTTP_PORT` in `.env`) in your browser, register the instance admin through **God mode**, then create your workspace and start working.

## 🛠️ Local development

Requirements: [Node.js 22+](https://nodejs.org/) (see `.node-version`), Docker Engine, Python 3.12 with [uv](https://docs.astral.sh/uv/) (only for running the API outside Docker), and pnpm (enabled automatically via `corepack`).

```bash
./setup.sh                                        # env files + dependencies
docker compose -f docker-compose-local.yml up -d   # backing services (db, redis, mq, storage)
pnpm dev                                          # web on :3000, admin on :3001
```

- Register yourself as the instance admin at <http://localhost:3001/god-mode/>, then sign in at <http://localhost:3000> with the same credentials.
- Backend only: `cd apps/api && uv sync`, then `uv run python manage.py ...`

## 📜 Common commands

Run from the repository root:

| Command         | Description                                        |
| --------------- | -------------------------------------------------- |
| `pnpm dev`      | Start all dev servers (web on 3000, admin on 3001) |
| `pnpm build`    | Build all packages and apps                       |
| `pnpm check`    | Run all checks (format, lint, types)               |
| `pnpm fix`      | Auto-fix format and lint issues                   |
| `pnpm doctor`  | Run the React diagnostics playbook                |

## 🧪 Testing

The Django/pytest suite runs in an isolated Docker stack:

```bash
docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests
```

See [apps/api/tests/RUNNING_TESTS.md](./apps/api/tests/RUNNING_TESTS.md) for the full walkthrough.

## 📚 Documentation

- [Contributing guide](./CONTRIBUTING.md)
- [Agent development guide](./AGENTS.md)
- [Linting](./docs/linting.md)
- [Self-hosting guides](./deployments/)

## 🙏 Acknowledgements and license

Luma is a fork of [Plane](https://github.com/makeplane/plane) by Plane Software Inc. and its contributors. Huge thanks to them and to everyone who built the upstream project.

Per the AGPL-3.0, the original copyright headers in source files are preserved, and this project is licensed under the [GNU Affero General Public License v3.0](./LICENSE.txt).
