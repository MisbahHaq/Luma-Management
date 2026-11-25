# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import csv
import io
import logging
import os
from datetime import date
import uuid

from dateutil.relativedelta import relativedelta
from django.db import IntegrityError
from django.db.models import Count, F, Func, IntegerField, OuterRef, Prefetch, Q

from django.db.models.fields import DateField
from django.db.models.functions import Cast, ExtractDay, ExtractWeek


# Django imports
from django.http import HttpResponse
from django.utils import timezone

# Third party modules
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import (
    WorkSpaceAdminPermission,
    WorkSpaceBasePermission,
    WorkspaceEntityPermission,
)

# Module imports
from plane.app.serializers import WorkSpaceSerializer, WorkspaceThemeSerializer
from plane.app.views.base import BaseAPIView, BaseViewSet
from plane.app.views.workspace.user import _visible_issues_q
from plane.db.models import (
    Issue,
    IssueActivity,
    Workspace,
    WorkspaceMember,
    WorkspaceTheme,
    Profile,
)
from plane.app.permissions import ROLE, allow_permission
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS
from plane.license.utils.instance_value import get_configuration_value
from plane.bgtasks.workspace_seed_task import workspace_seed
from plane.utils.url import contains_url
from plane.utils.csv_utils import sanitize_csv_row

logger = logging.getLogger(__name__)


class WorkSpaceViewSet(BaseViewSet):
    model = Workspace
    serializer_class = WorkSpaceSerializer
    permission_classes = [WorkSpaceBasePermission]

    search_fields = ["name"]
    filterset_fields = ["owner"]

    lookup_field = "slug"

    def get_queryset(self):
        member_count = (
            WorkspaceMember.objects.filter(workspace=OuterRef("id"), member__is_bot=False, is_active=True)
            .order_by()
            .annotate(count=Func(F("id"), function="Count", output_field=IntegerField()))
            .values("count")
        )

        return (
            self.filter_queryset(super().get_queryset().select_related("owner"))
            .order_by("name")
            .filter(
                workspace_member__member=self.request.user,
                workspace_member__is_active=True,
            )
            .annotate(total_members=member_count)
        )

    def create(self, request):
        try:
            (DISABLE_WORKSPACE_CREATION,) = get_configuration_value(
                [
                    {
                        "key": "DISABLE_WORKSPACE_CREATION",
                        "default": os.environ.get("DISABLE_WORKSPACE_CREATION", "0"),
                    }
                ]
            )

            if DISABLE_WORKSPACE_CREATION == "1":
                return Response(
                    {"error": "Workspace creation is not allowed"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            serializer = WorkSpaceSerializer(data=request.data)

            slug = request.data.get("slug", False)
            name = request.data.get("name", False)

            if not name or not slug:
                return Response(
                    {"error": "Both name and slug are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if len(name) > 80 or len(slug) > 48:
                return Response(
                    {"error": "The maximum length for name is 80 and for slug is 48"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if contains_url(name):
                return Response(
                    {"error": "Name cannot contain a URL"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if serializer.is_valid(raise_exception=True):
                serializer.save(owner=request.user)
                # Create Workspace member
                _ = WorkspaceMember.objects.create(
                    workspace_id=serializer.data["id"],
                    member=request.user,
                    role=20,
                    company_role=request.data.get("company_role", ""),
                )

                # Get total members and role
                total_members = WorkspaceMember.objects.filter(workspace_id=serializer.data["id"]).count()
                data = serializer.data
                data["total_members"] = total_members
                data["role"] = 20

                # Seeding is best-effort. The workspace is already persisted at
                # this point, so a missing/unreachable task broker must not turn
                # a successful creation into a 500 — the UI would then report
                # "Workspace could not be created" even though it exists.
                try:
                    workspace_seed.delay(serializer.data["id"])
                except Exception as exc:
                    logger.warning(
                        "Could not enqueue workspace seed task for %s: %s",
                        serializer.data["id"],
                        exc,
                    )
                    # Fall back to seeding inline so a new workspace still gets
                    # its starter project/data when no broker is available.
                    try:
                        workspace_seed.apply(args=[serializer.data["id"]], throw=False)
                    except Exception as inline_exc:
                        logger.warning(
                            "Could not seed workspace %s inline: %s",
                            serializer.data["id"],
                            inline_exc,
                        )

                return Response(data, status=status.HTTP_201_CREATED)
            return Response(
                [serializer.errors[error][0] for error in serializer.errors],
                status=status.HTTP_400_BAD_REQUEST,
            )

        except IntegrityError as e:
            # PostgreSQL reports "already exists", SQLite reports "UNIQUE
            # constraint failed". A soft-deleted workspace still holds its
            # slug in the database, so either message means the slug is taken.
            error_message = str(e)
            if "slug" in error_message and (
                "already exists" in error_message or "UNIQUE constraint failed" in error_message
            ):
                return Response(
                    {"slug": "The workspace with the slug already exists"},
                    status=status.HTTP_409_CONFLICT,
                )
            # Always return a Response: falling through would make DRF's
            # finalize_response() raise an AssertionError and surface as a 500.
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    def remove_last_workspace_ids_from_user_settings(self, id: uuid.UUID) -> None:
        """
        Remove the last workspace id from the user settings
        """
        Profile.objects.filter(last_workspace_id=id).update(last_workspace_id=None)
        return

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, *args, **kwargs):
        # Get the workspace
        workspace = self.get_object()
        self.remove_last_workspace_ids_from_user_settings(workspace.id)
        return super().destroy(request, *args, **kwargs)


class UserWorkSpacesEndpoint(BaseAPIView):
    search_fields = ["name"]
    filterset_fields = ["owner"]
    use_read_replica = True

    def get(self, request):
        fields = [field for field in request.GET.get("fields", "").split(",") if field]
        member_count = (
            WorkspaceMember.objects.filter(workspace=OuterRef("id"), member__is_bot=False, is_active=True)
            .order_by()
            .annotate(count=Func(F("id"), function="Count", output_field=IntegerField()))
            .values("count")
        )

        role = WorkspaceMember.objects.filter(workspace=OuterRef("id"), member=request.user, is_active=True).values(
            "role"
        )

        workspace = (
            Workspace.objects.prefetch_related(
                Prefetch(
                    "workspace_member",
                    queryset=WorkspaceMember.objects.filter(member=request.user, is_active=True),
                )
            )
            .annotate(role=role, total_members=member_count)
            .filter(workspace_member__member=request.user, workspace_member__is_active=True)
            .distinct()
        )

        workspaces = WorkSpaceSerializer(
            self.filter_queryset(workspace),
            fields=fields if fields else None,
            many=True,
        ).data

        return Response(workspaces, status=status.HTTP_200_OK)


class WorkSpaceAvailabilityCheckEndpoint(BaseAPIView):
    def get(self, request):
        slug = request.GET.get("slug", False)

        if not slug or slug == "":
            return Response(
                {"error": "Workspace Slug is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Use all_objects so soft-deleted workspaces still reserve their slug:
        # the database unique constraint applies to them too, and the check
        # must agree with what `create()` will accept.
        workspace = Workspace.all_objects.filter(slug=slug).exists() or slug in RESTRICTED_WORKSPACE_SLUGS
        return Response({"status": not workspace}, status=status.HTTP_200_OK)


class WeekInMonth(Func):
    function = "FLOOR"
    template = "(((%(expressions)s - 1) / 7) + 1)::INTEGER"


class UserWorkspaceDashboardEndpoint(BaseAPIView):
    def get(self, request, slug):
        issue_activities = (
            IssueActivity.objects.filter(
                actor=request.user,
                workspace__slug=slug,
                created_at__date__gte=date.today() + relativedelta(months=-3),
            )
            .annotate(created_date=Cast("created_at", DateField()))
            .values("created_date")
            .annotate(activity_count=Count("created_date"))
            .order_by("created_date")
        )

        month = request.GET.get("month", 1)

        completed_issues = (
            Issue.issue_objects.filter(
                assignees__in=[request.user],
                workspace__slug=slug,
                completed_at__month=month,
                completed_at__isnull=False,
            )
            .annotate(day_of_month=ExtractDay("completed_at"))
            .annotate(week_in_month=WeekInMonth(F("day_of_month")))
            .values("week_in_month")
            .annotate(completed_count=Count("id"))
            .order_by("week_in_month")
        )

        assigned_issues = Issue.issue_objects.filter(workspace__slug=slug, assignees__in=[request.user]).count()

        pending_issues_count = Issue.issue_objects.filter(
            ~Q(state__group__in=["completed", "cancelled"]),
            workspace__slug=slug,
            assignees__in=[request.user],
        ).count()

        completed_issues_count = Issue.issue_objects.filter(
            workspace__slug=slug, assignees__in=[request.user], state__group="completed"
        ).count()

        issues_due_week = (
            Issue.issue_objects.filter(workspace__slug=slug, assignees__in=[request.user])
            .annotate(target_week=ExtractWeek("target_date"))
            .filter(target_week=timezone.now().date().isocalendar()[1])
            .count()
        )

        state_distribution = (
            Issue.issue_objects.filter(workspace__slug=slug, assignees__in=[request.user])
            .annotate(state_group=F("state__group"))
            .values("state_group")
            .annotate(state_count=Count("state_group"))
            .order_by("state_group")
        )

        overdue_issues = Issue.issue_objects.filter(
            ~Q(state__group__in=["completed", "cancelled"]),
            workspace__slug=slug,
            assignees__in=[request.user],
            target_date__lt=timezone.now(),
            completed_at__isnull=True,
        ).values("id", "name", "workspace__slug", "project_id", "target_date")

        upcoming_issues = Issue.issue_objects.filter(
            ~Q(state__group__in=["completed", "cancelled"]),
            start_date__gte=timezone.now(),
            workspace__slug=slug,
            assignees__in=[request.user],
            completed_at__isnull=True,
        ).values("id", "name", "workspace__slug", "project_id", "start_date")

        return Response(
            {
                "issue_activities": issue_activities,
                "completed_issues": completed_issues,
                "assigned_issues_count": assigned_issues,
                "pending_issues_count": pending_issues_count,
                "completed_issues_count": completed_issues_count,
                "issues_due_week_count": issues_due_week,
                "state_distribution": state_distribution,
                "overdue_issues": overdue_issues,
                "upcoming_issues": upcoming_issues,
            },
            status=status.HTTP_200_OK,
        )


class WorkspaceThemeViewSet(BaseViewSet):
    permission_classes = [WorkSpaceAdminPermission]
    model = WorkspaceTheme
    serializer_class = WorkspaceThemeSerializer

    def get_queryset(self):
        return super().get_queryset().filter(workspace__slug=self.kwargs.get("slug"))

    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = WorkspaceThemeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace, actor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExportWorkspaceUserActivityEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission]

    def generate_csv_from_rows(self, rows):
        """Generate CSV buffer from rows."""
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer, delimiter=",", quoting=csv.QUOTE_ALL)
        [writer.writerow(sanitize_csv_row(row)) for row in rows]
        csv_buffer.seek(0)
        return csv_buffer

    def post(self, request, slug, user_id):
        if not request.data.get("date"):
            return Response({"error": "Date is required"}, status=status.HTTP_400_BAD_REQUEST)

        user_activities = IssueActivity.objects.filter(
            ~Q(field__in=["comment", "vote", "reaction", "draft"]),
            _visible_issues_q(request.user, prefix="issue__"),
            workspace__slug=slug,
            created_at__date=request.data.get("date"),
            actor_id=user_id,
        ).select_related("actor", "workspace", "issue", "project")[:10000]

        header = [
            "Actor name",
            "Issue ID",
            "Project",
            "Created at",
            "Updated at",
            "Action",
            "Field",
            "Old value",
            "New value",
        ]
        rows = [
            (
                activity.actor.display_name,
                f"{activity.project.identifier} - {activity.issue.sequence_id if activity.issue else ''}",
                activity.project.name,
                activity.created_at,
                activity.updated_at,
                activity.verb,
                activity.field,
                activity.old_value,
                activity.new_value,
            )
            for activity in user_activities
        ]
        csv_buffer = self.generate_csv_from_rows([header] + rows)
        response = HttpResponse(csv_buffer.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="workspace-user-activity.csv"'
        return response
