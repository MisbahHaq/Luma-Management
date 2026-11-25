# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Test Settings"""

from pathlib import Path

from dotenv import load_dotenv

from .sqlite_compat import apply_sqlite_compat_shims

# Local tests use the same env file as the dev server. This makes the SQLite
# fallback documented in README.md the default for unit tests.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from .common import *  # noqa

apply_sqlite_compat_shims()

DEBUG = True

# Send it in a dummy outbox
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

INSTALLED_APPS.append(  # noqa
    "plane.tests"
)
