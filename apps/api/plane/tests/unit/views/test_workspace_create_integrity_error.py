# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for ``POST /api/workspaces/`` integrity errors.

The ``except IntegrityError`` branch used to fall through and return ``None``
whenever the database reported a duplicate slug with anything other than
PostgreSQL's "already exists" wording. SQLite reports "UNIQUE constraint
failed", so every duplicate-slug create on a SQLite install surfaced as a 500
instead of a 409. A soft-deleted workspace still reserves its slug in the DB,
so the availability check has to look at ``all_objects`` too.
"""

from unittest.mock import patch

import pytest
from django.db import IntegrityError
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory

from plane.app.views.workspace.base import WorkSpaceAvailabilityCheckEndpoint, WorkSpaceViewSet


def _post_request(data):
    django_request = APIRequestFactory().post(
        "/api/workspaces/",
        data=data,
        content_type="application/json",
    )
    request = Request(django_request, parsers=[JSONParser()])
    request.user = object()
    return request


@pytest.mark.unit
@pytest.mark.parametrize(
    "error_message",
    [
        "UNIQUE constraint failed: workspaces.slug",
        'duplicate key value violates unique constraint "workspaces_slug_key" '
        "DETAIL: Key (slug)=(taken) already exists.",
    ],
)
def test_duplicate_slug_returns_conflict(error_message):
    """Both SQLite and PostgreSQL duplicate-slug errors must yield a 409."""
    with (
        patch("plane.app.views.workspace.base.get_configuration_value", return_value=("0",)),
        patch("plane.app.views.workspace.base.WorkSpaceSerializer") as serializer,
    ):
        serializer.return_value.is_valid.return_value = True
        serializer.return_value.save.side_effect = IntegrityError(error_message)

        response = WorkSpaceViewSet().create(_post_request({"name": "Taken", "slug": "taken"}))

    assert response.status_code == status.HTTP_409_CONFLICT
    assert "already exists" in response.data["slug"]


@pytest.mark.unit
def test_other_integrity_error_always_returns_a_response():
    """An unrecognised IntegrityError must not fall through to `None`."""
    with (
        patch("plane.app.views.workspace.base.get_configuration_value", return_value=("0",)),
        patch("plane.app.views.workspace.base.WorkSpaceSerializer") as serializer,
    ):
        serializer.return_value.is_valid.return_value = True
        serializer.return_value.save.side_effect = IntegrityError("FOREIGN KEY constraint failed")

        response = WorkSpaceViewSet().create(_post_request({"name": "Broken", "slug": "broken"}))

    assert isinstance(response, Response)
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.unit
def test_soft_deleted_slug_is_reported_as_unavailable():
    """The availability check must include soft-deleted workspaces."""
    request = APIRequestFactory().get("/api/workspace-slug-check/", {"slug": "taken"})

    with patch("plane.app.views.workspace.base.Workspace") as workspace:
        # The default (soft-deletion) manager cannot see the row...
        workspace.objects.filter.return_value.exists.return_value = False
        # ...but all_objects can, because the DB unique constraint still applies.
        workspace.all_objects.filter.return_value.exists.return_value = True

        response = WorkSpaceAvailabilityCheckEndpoint().get(request)

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"status": False}
    workspace.all_objects.filter.assert_called_once_with(slug="taken")
