# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Regression tests for ``GET /api/users/me/workspaces/`` serialization.

The ``total_members`` subquery uses ``Func(F("id"), function="Count")``. Django
infers the expression's output field from ``F("id")``, which is a UUIDField. On
SQLite that makes the backend call ``uuid.UUID(<count>)`` while serializing the
annotation, raising ``AttributeError: 'int' object has no attribute 'replace'``
and turning the workspace list into a 500. Counting must yield an integer.
"""

import uuid
from unittest.mock import patch

import pytest
from django.db.models import IntegerField
from rest_framework import status
from rest_framework.test import APIRequestFactory

from plane.app.views.workspace.base import UserWorkSpacesEndpoint


@pytest.mark.unit
def test_member_count_annotation_has_integer_output_field():
    """The COUNT annotation must be an IntegerField so SQLite can serialize it."""
    captured = {}

    def capture_queryset(queryset, *args, **kwargs):
        captured["queryset"] = queryset
        return type("Serializer", (), {"data": []})()

    request = APIRequestFactory().get("/api/users/me/workspaces/")
    request.user = uuid.UUID("90473653-58aa-4181-ad2a-6054bcc999d2")

    with (
        patch("plane.app.views.workspace.base.WorkSpaceSerializer", side_effect=capture_queryset),
        patch.object(UserWorkSpacesEndpoint, "filter_queryset", side_effect=lambda qs: qs),
    ):
        response = UserWorkSpacesEndpoint().get(request)

    assert response.status_code == status.HTTP_200_OK
    annotation = captured["queryset"].query.annotations["total_members"]
    assert isinstance(annotation.output_field, IntegerField)
