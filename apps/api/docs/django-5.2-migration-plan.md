# Django 5.2 upgrade notes (`apps/api`)

> **Status:** Completed. This is a historical record of the Django 4.2 LTS → 5.2 LTS upgrade.

## Result

- `apps/api` now targets Django 5.2 LTS; dependency pins are recorded in `apps/api/pyproject.toml` and `apps/api/uv.lock`.
- The application code needed no breaking-change rewrites. The upgrade was primarily a coordinated dependency bump plus verification.
- Three supporting changes were made:
  1. `plane/urls.py` guards the debug-toolbar URL include with `apps.is_installed("debug_toolbar")`, required by django-debug-toolbar 6.0.
  2. `plane/db/migrations/0122_alter_draftissue_assignees_alter_issue_assignees_and_more.py` is a state-only `AlterField` for Django 5.1 `through_fields` normalization. It performs no DDL.
  3. `plane/tests/contract/app/test_authentication.py` clears the shared cache before tests, fixing pre-existing throttle failures.

## Verification

Run from `apps/api`:

```bash
uv run python manage.py check
uv run python manage.py makemigrations --check --dry-run
uv run python manage.py migrate
uv run pytest
uv run python manage.py check --deploy
```

The original upgrade was verified with a full `pytest` run, Django system checks, a clean migration state, and OpenAPI schema generation with `drf-spectacular`.

## Notes

- `FORMS_URLFIELD_ASSUME_HTTPS` was deliberately not added: in Django 5.2 it emits its own deprecation warning and there are no `forms.URLField` usages to silence.
- The OpenTelemetry dependency set is version-locked and should be upgraded as a separate, self-contained change.
- Rollback consists of reverting the dependency pins and the three supporting changes via git. No destructive data migration was introduced.
