# Running the API Test Suite

This guide covers running the Django/pytest suite for `apps/api` with a local `uv` environment. Unit tests run against SQLite by default; integration and smoke tests that need PostgreSQL, Valkey/Redis, RabbitMQ, and MinIO expect those services to be running locally.

For background on the test layout, markers, and fixtures, see [`TESTING_GUIDE.md`](../plane/tests/TESTING_GUIDE.md) and [`README.md`](../plane/tests/README.md).

## Prerequisites

- Python 3.12 and [uv](https://docs.astral.sh/uv/)
- Env files generated via the setup script:

  ```bash
  ./setup.sh
  ```

  This copies `apps/api/.env.example` → `apps/api/.env` (along with the other app env files). Review that file before your first test run.

## Running the suite

All commands are run from the repo root.

### Full suite

```bash
cd apps/api
uv sync
uv run pytest
```

### Filtered runs

Anything passed after `pytest` is forwarded to pytest.

```bash
# Only unit tests (marker defined in pytest.ini)
uv run pytest -m unit

# A single directory, filtered by name
uv run pytest plane/tests/unit -k "test_workspace"

# Single file with verbose output
uv run pytest plane/tests/unit/models/test_workspace.py -vv
```

The available markers (`unit`, `contract`, `smoke`, `slow`) are declared in `apps/api/pytest.ini`.

## Test configuration

Test-time configuration comes from `apps/api/.env` and the settings selected in `apps/api/pytest.ini`. For a minimal local run, set the following in `apps/api/.env`:

```env
DATABASE_URL=sqlite:///db.sqlite3
# REDIS_URL unset: use the in-memory cache and eager Celery tasks
```

For integration runs, point the standard database, Redis, RabbitMQ, and S3 settings in `apps/api/.env` at services you run locally. Tests use Django's test database and mocked external dependencies where possible; see [`TESTING_GUIDE.md`](../plane/tests/TESTING_GUIDE.md) for fixture details.

## Troubleshooting

- **`./apps/api/.env: no such file or directory`** — run `./setup.sh` from the repo root.
- **Postgres connection failures** — set `DATABASE_URL=sqlite:///db.sqlite3` for a minimal run, or start PostgreSQL locally and confirm `POSTGRES_HOST`, `POSTGRES_PORT`, and credentials in `apps/api/.env`.
- **Redis connection failures** — leave `REDIS_URL` unset to use the in-memory fallback, or start Valkey/Redis locally and confirm the URL.
- **MinIO bucket missing** — start your S3-compatible service and create the bucket named by `AWS_S3_BUCKET_NAME` (default `uploads`).
- **Dependency changes** — rerun `uv sync` from `apps/api`; the lockfile is committed and should be updated with `uv lock` when dependencies change.
