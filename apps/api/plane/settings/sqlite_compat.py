# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Compatibility shims for running the Django app on SQLite locally."""

import os
from uuid import UUID

from django.core.serializers.json import DjangoJSONEncoder

_applied = False


class _SQLiteArrayFieldEncoder(DjangoJSONEncoder):
    """Encode UUID values stored in PostgreSQL ArrayFields as strings on SQLite."""

    def default(self, obj):
        if isinstance(obj, UUID):
            return str(obj)
        return super().default(obj)


def apply_sqlite_compat_shims() -> None:
    """Patch PostgreSQL-only Django primitives when using a SQLite database."""
    global _applied

    if _applied or not os.environ.get("DATABASE_URL", "").startswith("sqlite"):
        return

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
            kwargs.setdefault("encoder", _SQLiteArrayFieldEncoder)
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
    _applied = True

    print("[sqlite-shim] Patched ArrayField, AddIndexConcurrently and Count output for SQLite", flush=True)
