#!/usr/bin/env python
# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os
import sys
from pathlib import Path

# Load environment variables from .env file (for local development without Docker).
# In Docker, env vars are injected via docker-compose `env_file:`, so dotenv is
# optional there. Import defensively so the file works in both environments.
try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

# --- SQLite compatibility shims -------------------------------------------
# This project uses PostgreSQL-specific fields (ArrayField) that SQLite does
# not support.  When running locally with `DATABASE_URL=sqlite:///...`, patch
# them in place so the app works without PostgreSQL.
try:
    import django.contrib.postgres.fields as _pg_fields
    import django.contrib.postgres.operations as _pg_ops
    from django.db import models
    from django.db.migrations.operations import models as _migration_models

    class _SQLiteArrayField(models.JSONField):
        """Drop-in replacement for ArrayField that stores JSON on SQLite."""

        def __init__(self, *args, **kwargs):
            # base_field / size are Postgres-only; drop them for SQLite.
            kwargs.pop("base_field", None)
            kwargs.pop("size", None)
            super().__init__(*args, **kwargs)

    _pg_fields.ArrayField = _SQLiteArrayField

    # Replace AddIndexConcurrently (Postgres-only) with plain AddIndex.
    _pg_ops.AddIndexConcurrently = _migration_models.AddIndex

    # COUNT() always returns an integer, but `Func(F("id"), function="Count")`
    # inherits UUIDField from the counted id. SQLite then tries
    # uuid.UUID(<count>) and raises "'int' object has no attribute 'replace'".
    # Give every unannotated Count Func an IntegerField output on SQLite.
    _original_func_init = models.Func.__init__

    def _sqlite_func_init(self, *expressions, output_field=None, **extra):
        if extra.get("function") == "Count" and output_field is None:
            output_field = models.IntegerField()
        _original_func_init(self, *expressions, output_field=output_field, **extra)

    models.Func.__init__ = _sqlite_func_init

    print("[sqlite-shim] Patched ArrayField, AddIndexConcurrently and Count output for SQLite", flush=True)

except Exception as exc:
    print(f"[sqlite-shim] Patching failed: {exc}", flush=True)
    raise
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
