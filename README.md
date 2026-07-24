# Luma Management

Luma is a full-stack, self-hosted project management and work-tracking platform. It supports project planning, task management, sprint tracking, time logging, reporting, team collaboration, and public client portals — all within a modern, unified interface.

---
<img width="1116" height="774" alt="Screenshot 2026-07-24 164618" src="https://github.com/user-attachments/assets/14dabc78-c54f-421a-8020-c5ba282523eb" />
<img width="1439" height="1079" alt="Screenshot 2026-07-24 164147" src="https://github.com/user-attachments/assets/f866fcd8-7f70-4c14-849e-a5be6eff6af4" />



## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | ASP.NET Core 8 (Web API) + C# 12 |
| **Database** | SQLite via Entity Framework Core 8 |
| **Auth** | ASP.NET Core Identity + JWT Bearer (12h) |
| **SSO** | OpenID Connect + GitHub OAuth |
| **Real-time** | SignalR (`NotificationHub`) |
| **PDF Export** | QuestPDF |
| **Excel Export** | ClosedXML |
| **API Docs** | Swashbuckle (Swagger / OpenAPI) |
| **Frontend** | React 19 + TypeScript + Vite 8 |
| **Routing** | React Router 6 |
| **Styling** | Tailwind CSS v4 + custom design tokens |

---

## What It Can Do

### Authentication & Access Control
- **JWT-based login/registration** with role-based access control
- **Global roles**: `Admin`, `Member`, `Viewer`
- **Per-project roles**: `Owner`, `Editor`, `Viewer`
- **SSO via OpenID Connect** (configurable authority/client/secret)
- **GitHub OAuth** — sign in with GitHub (auto-provisions account on first login)
- **API Key authentication** for third-party integrations (`X-Api-Key`)
- **Rate limiting** — 1000 requests/minute per API key or IP
- **Seeded admin account** — `admin@luma.com` / `Admin@123`

### Workspaces
- **Workspaces** sit inside a Tenant as an organizational grouping of projects
- **Hierarchy**: Tenant → Workspace → Project → Task
- **Workspace roles**: `Owner`, `Admin`, `Member`
- Create, rename, and delete workspaces
- **Workspace switcher** in the top header — switch context instantly
- Member management: invite, remove, change roles
- Every project belongs to exactly one workspace

### Project Management
- Create, update, and delete projects (requires selecting a workspace)
- Project listing with task counts and completion percentages
- **Project members** — add/remove members, change roles (Owner/Editor/Viewer)
- **Last Owner protection** — last Owner cannot be removed or demoted
- **Public access tokens** — generate/regenerate/revoke tokens for external sharing
- **Custom fields** per project (Text, Number, Date, Select)
- **Project templates** — create reusable templates with nested task structures
- Create projects from templates

### Issue Keys
- **Real per-project issue keys** (e.g. `LUMA-42`) — not client-derived
- `IssueKeyPrefix` set at project creation, editable by Owner only
- `IssueNumber` auto-incremented per project starting at 1
- Displayed in task list, Kanban, detail modal, search results, notifications, and activity log

### Task & Issue Management
- Full CRUD for tasks with title, description, status, priority, type, assignee, milestone, and due date
- **Task types**: Epic, Story, Bug, Task
- **Priorities**: Low, Medium, High, Critical
- **Statuses**: ToDo, InProgress, Done
- **Task hierarchy** — Epics can have child tasks (with cycle detection)
- **Inline quick-add** for fast task creation under Epics and in the backlog
- **Kanban board** with drag-and-drop status changes
- **List view** with collapsible Epic groups, search, and filter popover
- **Task detail modal** with full editing, comments, attachments, and activity log
- Pagination on task lists

### Milestones
- **Milestones** are goal-based markers distinct from time-boxed sprints
- Optional due date, no start date
- Assign tasks to milestones independently of sprins
- Progress tracking (% of linked tasks completed)
- CRUD endpoints (`/api/milestones`) and panel per project
- Milestone assignment in task detail modal and bulk actions

### Sprint Management
- Create, update, and delete sprints with name, description, status, and dates
- **Sprint statuses**: Planned, Active, Completed
- Assign and remove tasks from sprints
- Sprint progress tracking (completion %)
- Expandable sprint panels showing assigned tasks

### Dependencies & Gantt
- **Task dependencies** — `Blocks` and `BlockedBy` relationships
- **Cycle detection** (BFS-based) prevents circular dependencies
- **Gantt timeline view** using Frappe Gantt with status-colored bars
- **Dependencies panel** for managing task blockers

### Time Tracking
- Log hours per task with date and optional note
- Timesheet view showing all time logs for a project
- Per-user time log endpoints
- Total hours tracking per project and per user
- Delete own time logs

### Comments & Activity
- **Comments** on tasks (paginated)
- **Activity logs** per task and per project (25 action types)
- Tracked actions: ProjectCreated/Updated/Deleted, TaskCreated/Updated/Moved/Deleted, CommentAdded, AttachmentAdded/Removed, MemberAdded/Removed, SprintCreated/Updated/Completed, DependencyAdded/Removed, TimeLogged
- **Recent Activity** feed on dashboard (real data, not hardcoded)

### File Attachments
- Upload, download, and delete attachments on tasks
- Local filesystem or MinIO/S3 storage (pluggable)
- 25MB upload limit
- File metadata: name, content type, size, uploader, timestamp

### Notifications
- **In-app notifications** via SignalR real-time hub
- Notification bell with unread count badge
- Mark as read / mark all as read
- **Email notifications** (SendGrid or SMTP) for task assignments, comments, etc.
- Notification types: TaskAssigned, TaskStatusChanged, CommentAdded, AttachmentAdded, MemberAdded, Mentioned, SprintCreated, DependencyAdded, TimeLogged

### Reporting & Analytics
- **Dashboard summary** — total projects, tasks, completed, in-progress, overdue, overall completion rate
- **Project health** — completion %, overdue tasks, status/priority distributions, assignee workload, time logged
- **Burndown chart** — remaining tasks vs ideal line per active sprint
- **Velocity tracking** — completed tasks per sprint, average velocity
- **Cross-project dashboard** — Admins can see all projects at a glance

### Team & Resource Management
- **Team calendars** CRUD with color and description
- **Calendar events** with title, start/end, all-day flag, project/task linking, attendees
- Date range queries for calendar events
- **Team member capacity** — capacity hours and allocated hours per user per day
- **Resource utilization** view (task count, active projects, utilization %)
- **Workload dashboard** combining utilization and timeline

### Custom Fields
- Per-project custom fields: Text, Number, Date, Select
- Required flag, sort order
- Custom field values per task
- Options support for Select type

### Project Templates
- Create, update, and delete templates
- Public/private visibility
- Hierarchical template tasks (parent/child)
- Category and icon support
- Create project from template (copies tasks as ToDo)

### Public Portal
- Token-gated read-only access for external clients
- View project metadata, task list, member list, and health metrics
- Accessible via `/portal/:projectId`

### Export
- **PDF export** — project report (summary + task list) via QuestPDF
- **Excel export** — project tasks as `.xlsx` via ClosedXML
- **Burndown PDF export** — burndown data as formatted PDF table

### Multi-Tenancy
- Tenant entity with name, slug, and active status
- Workspace entity inside Tenant for organizational grouping
- TenantId on Project (optional)
- Global query filters for tenant isolation
- Cross-tenant Admin views

### Webhooks & Integrations
- Create/update/delete webhook subscriptions
- Tenant and project scoping
- Event selection (comma-separated)
- Secret signing (`X-Luma-Signature` header)
- Delivery tracking with status, attempts, and errors
- Retry with exponential backoff
- Dead-letter queue after max attempts

### Background Jobs
- Hosted background service with channel-based queue
- Priority, attempts, max attempts
- Exponential backoff on failure
- Dead-letter queue
- Parent job support
- Lock mechanism to prevent duplicate processing

---

## Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- npm or yarn

### Run the Backend

```bash
cd Luma.Server
dotnet run watch
```

The API starts at `https://localhost:52613` (or the port shown in console output).

### Run the Frontend

```bash
cd luma.client
npm install
npm run dev
```

The frontend starts at `http://localhost:5173` (or the port shown in Vite output).

### Seeded Account

| Field | Value |
|-------|-------|
| Email | `admin@luma.com` |
| Password | `Admin@123` |
| Role | Admin |

### Reset Database

Delete `Luma.Server/luma.db` — it will be recreated with the seeded admin on next run.

### Apply Migrations

```bash
cd Luma.Server
dotnet ef database update
```

---

## API Documentation

Swagger/OpenAPI docs are available at:

```
https://localhost:52613/swagger
```

Key endpoint groups:

| Area | Base Route |
|------|-----------|
| Auth | `/api/auth` |
| Workspaces | `/api/workspaces` |
| Projects | `/api/projects` |
| Tasks | `/api/tasks` |
| Milestones | `/api/milestones` |
| Sprints | `/api/sprints` |
| Dependencies | `/api/taskdependencies` |
| Time Logs | `/api/timelogs` |
| Comments | `/api/comments` |
| Reports | `/api/reports` |
| Export | `/api/export` |
| Notifications | `/api/notifications` |
| Activity | `/api/activity` |
| Attachments | `/api/attachments` |
| Webhooks | `/api/webhooks` |
| API Keys | `/api/api-keys` |
| Templates | `/api/project-templates` |
| Custom Fields | `/api/projects/{id}/custom-fields` |
| Public Portal | `/api/public/projects/{projectId}` |
| Team Calendars | `/api/team-calendars` |
| Workload | `/api/workload` |
| Tenants | `/api/tenants` |
| Background Jobs | `/api/jobs` |
| GitHub OAuth | `/api/github` |

---

## Configuration

Key settings in `Luma.Server/appsettings.json`:

| Section | Purpose |
|---------|---------|
| `ConnectionStrings:DefaultConnection` | SQLite database path |
| `Jwt` | Signing key, issuer, audience |
| `Sso` | OpenID Connect authority/client/secret/scopes |
| `GitHub` | GitHub OAuth client ID/secret/callback path |
| `RateLimiting` | Requests limit and window (default: 1000/min) |
| `Storage` | Local/MinIO file storage configuration |
| `Email` | SendGrid/SMTP/None email provider |
| `Frontend:BaseUrl` | Frontend URL for email links |

---

## What's Missing

Compared to mature project management tools like Linear, Jira, and Asana, Luma currently lacks the following:

### Critical Gaps
- **Search** — The search box is UI-only; no backend search endpoint exists
- **Password reset / forgot password** — No account recovery flow
- **Email verification** — Accounts are active immediately
- **Two-factor authentication (2FA / MFA)**
- **Profile / settings management** — Settings page is a placeholder
- **Real-time collaboration** — SignalR only pushes notifications, not live task updates
- **Mentions / @users in comments** — Notification type exists but no UI to trigger it
- **Labels / tags** — Only custom fields (heavier weight)
- **Bulk operations** — No bulk edit, delete, move, or assign
- **Import** — No CSV/JSON/Excel import for tasks or projects
- **Data backup / restore** — Only per-project PDF/Excel export
- **Audit log viewer in UI** — Activity logs exist in DB but no dedicated frontend page

### Workflow & Automation
- **Custom workflows** — Statuses are hardcoded (ToDo / InProgress / Done)
- **Automation rules** — No "when X happens, do Y"
- **SLA tracking** — No service level agreements or escalation
- **Approval workflows**
- **Recurring tasks**
- **Task templates per project** — Only full project templates
- **Issue triage / inbox view**
- **Assignment rules**

### Planning & Tracking
- **Story points** — Velocity uses task count, not story points
- **Releases / versions**
- **Portfolio / epic management** across projects
- **Cross-project epics**
- **Capacity planning at team level** — Only per-user per-project capacity
- **Time tracking timer / stopwatch** — Manual entry only
- **Billable / non-billable time flag**
- **Approval for time logs**

### Integration & Extensibility
- **GitHub / GitLab integration** — No commit/PR linking
- **CI/CD pipeline integration**
- **Slack / Teams / Discord bots** — Only raw webhooks
- **Calendar sync** (Google Calendar, Outlook)
- **LDAP / AD integration**
- **SAML** — Only OIDC
- **SCIM provisioning**
- **OAuth2 for third-party apps** — Only API keys and OIDC
- **Mobile app**
- **Offline mode**

### Enterprise Features
- **Organization / workspace branding**
- **Billing / subscription management**
- **Usage limits or quotas**
- **Compliance reports** (GDPR, SOC2, etc.)
- **Data retention policies**
- **SSO group mapping**
- **JIT provisioning**
- **Audit trail export**
- **Role templates**

### UX & Usability
- **Dark mode**
- **Keyboard shortcuts**
- **Saved filters / views**
- **Custom dashboards** — Dashboard is fixed
- **Custom item types** — Fixed Epic/Story/Bug/Task
- **Custom statuses / columns** — Fixed Kanban columns
- **Drag-and-drop for sprints or dependencies**
- **Inline editing in Gantt view**
- **Attachment previews** — Only download links
- **Comment editing / deletion** — Comments are append-only
- **Task linking** (relates-to, duplicates, etc.) — Only Blocks/BlockedBy
- **Watch / star / favorite tasks**
- **My-tasks view** — No personalized task list
- **Inbox view**
- **Due date reminders** — No scheduled notifications
- **Workload heatmaps**
- **Team directory page** — Members page is a placeholder
- **Help / support page** — Placeholder only

---

## Architecture

```
Browser (React SPA)
   │  GET/POST /api/...
   ▼
Vite dev server ──proxies /api──► ASP.NET Core API
                                            │  JWT Bearer auth
                                            ▼
                                      EF Core ──► SQLite (luma.db)

Middleware Pipeline:
  Request
    → RateLimitingMiddleware (1000 req/min)
    → ApiKeyAuthenticationMiddleware (X-Api-Key)
    → TenantResolutionMiddleware (X-Tenant-Id)
    → Authentication / Authorization
    → Controllers
```

---

## License

MIT
