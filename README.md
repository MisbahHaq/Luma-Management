# Luma — Project Management Tool

Luma is a full-stack project management application. It lets teams organize work into
**Projects**, break them down into **Tasks** (with status, priority, due dates, and
assignees), discuss tasks through **Comments**, and visualize progress on a **Kanban
board**, a **list view**, or a **planning view** (Gantt, sprints, dependencies, time
tracking).

- **Phase 1** covers the core MVP (auth, RBAC, projects, tasks, comments, Kanban + list).
- **Phase 2** adds collaboration (file attachments, real-time SignalR updates, in-app + email
  notifications, per-task/project activity logs).
- **Phase 3** adds planning (sprints/milestones, a Gantt timeline, task dependencies with
  cycle detection, and time tracking / timesheets).
- **Phase 4** adds team & resource management (workload/capacity view, team calendars,
  custom fields per project, project templates).
- **Phase 5** adds reporting & insights (burndown charts, velocity, project health,
  PDF/Excel exports, client-facing read-only portal).
- **Phase 6** adds enterprise/scale features (multi-tenancy, SSO/OIDC, webhooks + public
  API for integrations, API keys, rate limiting, background job queue with retries and
  dead-letter handling).

Authentication is handled with ASP.NET Core Identity + JWT bearer tokens, and access is
role-based (`Admin`, `Member`, `Viewer`).

---

## Table of Contents
- [Tech Stack](#tech-stack)
- [Solution Structure](#solution-structure)
- [Architecture Overview](#architecture-overview)
- [Data Model](#data-model)
- [Authentication & Authorization](#authentication--authorization)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment / Configuration](#environment--configuration)

---

## Tech Stack

### Backend — `Luma.Server`
| Concern | Technology |
| --- | --- |
| Framework | ASP.NET Core 8 (Web API) |
| Language | C# 12 (Nullable enabled, ImplicitUsings) |
| ORM | Entity Framework Core 8 |
| Database | **SQLite** (file: `Luma.Server/luma.db`) |
| Authentication | ASP.NET Core Identity + JWT Bearer |
| SSO | OpenID Connect (Microsoft.AspNetCore.Authentication.OpenIdConnect) |
| PDF Export | QuestPDF 2024.12.0 |
| Excel Export | ClosedXML 0.104.2 |
| API Docs | Swagger / OpenAPI (Swashbuckle) |
| Dev Proxy | `Microsoft.AspNetCore.SpaProxy` (launches the SPA) |

### Frontend — `luma.client`
| Concern | Technology |
| --- | --- |
| Framework | React 19 |
| Language | TypeScript |
| Build tool | Vite 8 |
| Routing | React Router 6 |
| HTTP client | Axios (with auth interceptor) |
| Styling | Plain CSS (`src/index.css`) |

---

## Solution Structure

```
Luma/
├── Luma.slnx                 # Solution file
├── Luma.Server/              # ASP.NET Core Web API + EF Core + Identity + JWT
│   ├── Controllers/          # Auth, Projects, Tasks, Comments, Users, Sprints,
│   │                         # Dependencies, TimeLogs, Reports, Export, Webhooks,
│   │                         # ApiKeys, Tenants, SSO, PublicPortal, BackgroundJobs
│   ├── Models/               # ApplicationUser, Project, TaskItem, Comment, Sprint,
│   │                         # TaskDependency, TimeLog, Enums, ActivityLog, etc.
│   ├── DTOs/                 # Auth, Projects, Tasks, Comments, Users, Reports,
│   │                         # Workload, TeamCalendars, CustomFields, ProjectTemplates,
│   │                         # ApiKeys, Webhooks, Tenants, BackgroundJobs
│   ├── Data/                 # AppDbContext + SeedData
│   ├── Services/             # JwtService, ActivityService, NotificationService,
│   │                         # WebhookDispatcherService, BackgroundJobService, SsoOptions
│   ├── Middleware/            # TenantResolutionMiddleware, ApiKeyAuthenticationMiddleware,
│   │                         # RateLimitingMiddleware
│   ├── Hubs/                 # NotificationHub (SignalR)
│   ├── Migrations/           # EF Core migrations (Phase1–Phase6)
│   ├── appsettings.json      # ConnectionStrings + Jwt + Sso + Storage + Email
│   └── luma.db               # SQLite database file (created at runtime)
└── luma.client/              # React + TypeScript + Vite SPA
    ├── src/
    │   ├── api/              # Axios client (attaches JWT) + endpoint definitions
    │   ├── components/       # KanbanBoard, TaskDetailModal, GanttView, SprintsPanel,
    │   │                     # TimeTracking, DependenciesPanel, NotificationsBell
    │   ├── context/          # AuthContext (auth state), NotificationContext
    │   ├── pages/            # Login, Register, Dashboard, ProjectDetail, Reports,
    │   │                     # PublicPortal
    │   ├── types/            # TypeScript types mapped to C# DTOs
    │   └── index.css         # Global styles + component styles
    └── vite.config.ts        # Dev server + /api proxy
```

---

## Architecture Overview

- **Backend** exposes a REST API under `/api`. It uses EF Core against a local SQLite
  database, ASP.NET Core Identity for user storage, and issues a signed JWT on login/register.
- **Frontend** is a Single Page Application. It talks to the API through an Axios instance
  (`src/api/client.ts`) that automatically attaches the `Authorization: Bearer <token>`
  header and redirects to login on a `401`.
- **Dev workflow:** running `dotnet run` in `Luma.Server` starts the API **and** the Vite
  dev server (via SpaProxy). The SPA is served on `https://localhost:52613` and proxies
  `/api` calls to the backend.

### Request flow
```
Browser (React SPA :52613)
   │  GET/POST /api/...
   ▼
Vite dev server  ──proxies /api──►  ASP.NET Core API (:7023 https / :5177 http)
                                          │  JWT Bearer auth (Issuer/Audience/Lifetime/Key)
                                          ▼
                                    EF Core  ──►  SQLite (luma.db)
```

### Middleware pipeline
```
Request
  → RateLimitingMiddleware (100 req/min per key/IP)
  → ApiKeyAuthenticationMiddleware (X-Api-Key auth for integrations)
  → TenantResolutionMiddleware (X-Tenant-Id / query param resolution)
  → Authentication / Authorization
  → Controllers
```

---

## Data Model

### Core entities
| Entity | Key fields |
| --- | --- |
| `ApplicationUser` (IdentityUser) | `FullName?`, `Role` (`Admin`/`Member`/`Viewer`) |
| `Project` | `Id`, `Name`, `Description?`, `CreatedAt`, `CreatedByUserId` → `ApplicationUser`, `TenantId?` → `Tenant`, `PublicAccessToken?` |
| `TaskItem` | `Id`, `Title`, `Description?`, `Status` (`ToDo`/`InProgress`/`Done`), `Priority` (`Low`/`Medium`/`High`), `DueDate?`, `ProjectId` → `Project`, `SprintId?` → `Sprint`, `AssigneeId?` → `ApplicationUser` |
| `Comment` | `Id`, `TaskId` → `TaskItem`, `UserId` → `ApplicationUser`, `Text`, `CreatedAt` |
| `Sprint` | `Id`, `Name`, `Description?`, `Status` (`Planned`/`Active`/`Completed`), `StartDate?`, `EndDate?`, `ProjectId` → `Project`, `CreatedByUserId` → `ApplicationUser` |
| `TaskDependency` | `Id`, `TaskId` → `TaskItem`, `DependsOnTaskId` → `TaskItem`, `Type` (`Blocks`/`BlockedBy`), `ProjectId` → `Project` |
| `TimeLog` | `Id`, `TaskId` → `TaskItem`, `ProjectId` → `Project`, `UserId` → `ApplicationUser`, `Date`, `Hours`, `Note?`, `CreatedAt` |
| `Attachment` | `Id`, `TaskId` → `TaskItem`, `FileName`, `ContentType`, `SizeBytes`, `UploadedById` → `ApplicationUser`, `CreatedAt` |
| `ActivityLog` | `Id`, `Action` (enum), `Description`, `ProjectId?`, `TaskId?`, `ActorId` → `ApplicationUser`, `CreatedAt` |
| `Notification` | `Id`, `RecipientId` → `ApplicationUser`, `Type`, `Message`, `Link?`, `ProjectId?`, `TaskId?`, `IsRead`, `CreatedAt` |
| `ProjectMember` | `Id`, `ProjectId` → `Project`, `UserId` → `ApplicationUser`, `AddedAt` |

### Team & Resource Management (Phase 4)
| Entity | Key fields |
| --- | --- |
| `TeamMemberCapacity` | `Id`, `UserId`, `ProjectId` → `Project`, `Date`, `CapacityHours`, `AllocatedHours`, `CreatedAt`, `UpdatedAt` |
| `TeamCalendar` | `Id`, `Name`, `Color?`, `Description?`, `IsDefault`, `CreatedByUserId` → `ApplicationUser`, `CreatedAt` |
| `TeamCalendarEvent` | `Id`, `CalendarId` → `TeamCalendar`, `Title`, `Description?`, `StartDate`, `EndDate`, `IsAllDay`, `ProjectId?`, `TaskId?`, `Attendees?`, `CreatedAt`, `UpdatedAt` |
| `ProjectCustomField` | `Id`, `ProjectId` → `Project`, `Name`, `FieldType` (Text/Number/Date/Select), `IsRequired`, `Options?`, `SortOrder`, `IsActive`, `CreatedAt`, `UpdatedAt` |
| `ProjectCustomFieldValue` | `Id`, `CustomFieldId` → `ProjectCustomField`, `TaskId` → `TaskItem`, `Value?`, `CreatedAt`, `UpdatedAt` |
| `ProjectTemplate` | `Id`, `Name`, `Description?`, `Icon?`, `Category?`, `IsPublic`, `CreatedByUserId` → `ApplicationUser`, `CreatedAt` |
| `ProjectTemplateTask` | `Id`, `TemplateId` → `ProjectTemplate`, `Title`, `Description?`, `Priority`, `SortOrder`, `ParentTemplateTaskId?` → self |

### Reporting & Insights (Phase 5)
- Dashboard summary, burndown data, velocity, project health — computed from tasks, sprints, and time logs.

### Enterprise / Scale (Phase 6)
| Entity | Key fields |
| --- | --- |
| `Tenant` | `Id`, `Name`, `Slug` (unique), `IsActive`, `CreatedByUserId` → `ApplicationUser`, `CreatedAt` |
| `ApiKey` | `Id`, `TenantId` → `Tenant`, `Name`, `KeyPrefix`, `KeyHash` (SHA-256), `Scopes?`, `ExpiresAt?`, `CreatedByUserId`, `LastUsedAt?`, `IsActive`, `CreatedAt` |
| `WebhookSubscription` | `Id`, `TenantId` → `Tenant`, `ProjectId?`, `Url`, `Secret`, `Events` (comma-separated), `IsActive`, `CreatedByUserId`, `CreatedAt` |
| `WebhookDelivery` | `Id`, `SubscriptionId` → `WebhookSubscription`, `EventType`, `Payload`, `Status` (`Pending`/`Succeeded`/`Failed`/`DeadLettered`), `Attempts`, `MaxAttempts`, `NextAttemptAt?`, `LastError?`, `CreatedAt`, `CompletedAt?` |
| `BackgroundJob` | `Id`, `TenantId?`, `Type`, `Payload`, `Status` (`Pending`/`Processing`/`Completed`/`Failed`/`DeadLettered`), `Priority`, `Attempts`, `MaxAttempts`, `NextAttemptAt?`, `CreatedAt`, `StartedAt?`, `CompletedAt?`, `Error?`, `ParentJobId?`, `LockedUntil?` |

### Pagination
List endpoints return `PagedResult<T>`:
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20,
  "totalPages": 0
}
```

Query params: `?page=1&pageSize=20`. Defaults vary by endpoint (typically 20). Pass a larger `pageSize` (e.g. `100`) when you need more records for views like Kanban.

### Relationships
- A **Project** has many **Tasks** (cascade delete).
- A **Task** has many **Comments** (cascade delete).
- A **Task** has many **Attachments** (cascade delete).
- A **Task** has an optional **Assignee** (set null on user delete).
- A **Project** has a **CreatedByUser** (restrict delete).
- A **Project** has many **Sprints** (cascade delete). A **Task** may belong to one **Sprint** (set null on sprint delete).
- A **Task** may have many **TaskDependencies** (blocking / blocked-by). Cycles are rejected at creation time.
- A **Task** has many **TimeLogs** (cascade delete).
- A **Project** optionally belongs to a **Tenant** (set null on tenant delete).
- A **Tenant** has many **Projects**.
- A **WebhookSubscription** belongs to a **Tenant** and optionally a **Project**.
- A **WebhookSubscription** has many **WebhookDeliveries** (cascade delete).
- A **BackgroundJob** is optionally scoped to a **Tenant** and can have a **ParentJobId**.

---

## Authentication & Authorization

- On **Register** / **Login**, the server validates credentials and returns a `token` (JWT)
  plus the user profile (`id`, `email`, `fullName`, `role`).
- The JWT carries the user `Id`, `Email`, and `Role` claims and is valid for 12 hours.
- The client stores the token in `localStorage` (`luma_token`, `luma_user`).
- **SSO** is supported via OpenID Connect. Configure `Sso:Authority`, `Sso:ClientId`,
  `Sso:ClientSecret`, and `Sso:Scopes` in `appsettings.json`. Endpoints:
  - `GET /api/sso/login` — initiates OIDC challenge
  - `GET /api/sso/callback` — exchanges code for JWT and returns it to the client
- **API keys** can be issued for third-party integrations. Send `X-Api-Key: <key>` to
  authenticate without a JWT. Keys are hashed (SHA-256) server-side; only the prefix and
  raw key are shown once at creation time.

### Role-based access (RBAC)
| Capability | Admin | Member | Viewer |
| --- | --- | --- | --- |
| View projects / tasks / comments | ✅ | ✅ | ✅ |
| Create / edit / delete **Projects** | ✅ | ✅ | ❌ |
| Create / edit / delete **Tasks** | ✅ | ✅ | ❌ |
| Add **Comments** | ✅ | ✅ | ✅ |
| List **Users** (for assignment) | ✅ | ✅ | ❌ |
| Manage tenants, API keys, webhooks, jobs | ✅ | ❌ | ❌ |

Enforced server-side with `[Authorize(Roles = "Admin,Member")]` (read is gated by
`[Authorize]` for any authenticated user) and mirrored client-side via `canEdit` in the UI.

### Seeded account
On first run the database is migrated and a default admin is created:

```
Email:    admin@luma.com
Password: Admin@123
```

> Change the JWT signing key in `appsettings.json` before deploying to production.

---

## API Reference

Base URL: `/api`

### Auth — `AuthController` (public)
| Method | Route | Body | Returns |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ email, password, fullName?, role }` | `AuthResponse` (token + user) |
| POST | `/auth/login` | `{ email, password }` | `AuthResponse` (token + user) |

### SSO — `SsoController` (public)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/sso/login` | Initiates OpenID Connect challenge |
| GET | `/sso/callback` | OIDC callback; returns JWT for matched local user |

### Projects — `ProjectsController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/projects` | List all projects |
| GET | `/projects/{id}` | Single project |
| POST | `/projects` | Create (Admin/Member) |
| PUT | `/projects/{id}` | Update (Admin/Member) |
| DELETE | `/projects/{id}` | Delete (Admin only) |
| GET | `/projects/{id}/members` | List project members |
| POST | `/projects/{id}/members` | Add member (Admin/Member) |
| DELETE | `/projects/{id}/members/{userId}` | Remove member (Admin/Member) |
| GET | `/projects/{id}/custom-fields` | List custom fields |
| POST | `/projects/{id}/public-access` | Enable public access + generate token |
| DELETE | `/projects/{id}/public-access` | Disable public access |
| POST | `/projects/{id}/public-access/regenerate` | Rotate public access token |

### Tasks — `TasksController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/tasks/project/{projectId}` | Tasks for a project. Query: `?page=1&pageSize=20` |
| GET | `/tasks/{id}` | Single task |
| POST | `/tasks` | Create (Admin/Member) |
| PUT | `/tasks/{id}` | Update status/priority/assignee (Admin/Member) |
| PUT | `/tasks/{id}/move` | Move task between statuses (Admin/Member) |
| DELETE | `/tasks/{id}` | Delete (Admin/Member) |

### Comments — `CommentsController` (authenticated)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/comments/task/{taskId}` | Comments for a task. Query: `?page=1&pageSize=20` |
| POST | `/comments` | Add a comment (any authenticated user) |

### Users — `UsersController` (Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/users` | List users (used to populate the assignee dropdown) |

### Sprints — `SprintsController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/sprints/project/{projectId}` | Sprints for a project |
| GET | `/sprints/{id}` | Single sprint |
| POST | `/sprints` | Create sprint (Admin/Member) |
| PUT | `/sprints/{id}` | Update (Admin/Member) |
| DELETE | `/sprints/{id}` | Delete (Admin/Member) |
| PUT | `/sprints/{id}/tasks/{taskId}` | Assign a task to the sprint (Admin/Member) |
| DELETE | `/sprints/{id}/tasks/{taskId}` | Remove a task from the sprint (Admin/Member) |

### Task Dependencies — `TaskDependenciesController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/taskdependencies/project/{projectId}` | All dependencies in a project |
| GET | `/taskdependencies/task/{taskId}` | Dependencies touching a task |
| POST | `/taskdependencies` | Create (rejects self-links and cycles) |
| DELETE | `/taskdependencies/{id}` | Remove |

### Time Logs — `TimeLogsController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/timelogs/task/{taskId}` | Time logs for a task. Query: `?page=1&pageSize=20` |
| GET | `/timelogs/project/{projectId}` | Time logs for a project. Query: `?page=1&pageSize=20` |
| GET | `/timelogs/user/{userId}` | A user's time logs. Query: `?page=1&pageSize=20` |
| POST | `/timelogs` | Log hours against a task (Admin/Member) |
| DELETE | `/timelogs/{id}` | Delete (Admin/Member) |

### Reports — `ReportsController` (authenticated)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/reports/dashboard` | Cross-project dashboard summary |
| GET | `/reports/projects/{projectId}/burndown` | Active sprint burndown data |
| GET | `/reports/projects/{projectId}/velocity` | Completed sprint velocity |
| GET | `/reports/projects/{projectId}/health` | Project health metrics |

### Export — `ExportController` (authenticated)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/export/projects/{projectId}/excel` | Download project tasks as `.xlsx` |
| GET | `/export/projects/{projectId}/pdf` | Download project report as `.pdf` |
| GET | `/export/projects/{projectId}/burndown/pdf` | Download burndown chart as `.pdf` |

### Workload — `WorkloadController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/workload/capacity` | Capacity entries. Query: `?projectId=&userId=&from=&to=&page=1&pageSize=20` |
| GET | `/workload/utilization` | Resource utilization per user |
| GET | `/workload/dashboard` | Combined utilization + timeline |
| POST | `/workload/capacity` | Set/update capacity (Admin/Member) |

### Team Calendars — `TeamCalendarsController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/team-calendars` | List calendars |
| GET | `/team-calendars/{id}` | Single calendar |
| POST | `/team-calendars` | Create (Admin/Member) |
| PUT | `/team-calendars/{id}` | Update (Admin/Member) |
| DELETE | `/team-calendars/{id}` | Delete (Admin only) |

### Team Calendar Events — `TeamCalendarEventsController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/team-calendars/{calendarId}/events` | Events for a calendar. Query: `?page=1&pageSize=20` |
| GET | `/team-calendars/{calendarId}/events/range?start=&end=` | Events in date range |
| POST | `/team-calendars/{calendarId}/events` | Create event (Admin/Member) |
| GET | `/team-calendars/{calendarId}/events/{id}` | Single event |
| PUT | `/team-calendars/{calendarId}/events/{id}` | Update (Admin/Member) |
| DELETE | `/team-calendars/{calendarId}/events/{id}` | Delete (Admin/Member) |

### Custom Fields — `CustomFieldsController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/projects/{projectId}/custom-fields` | List custom fields |
| POST | `/projects/{projectId}/custom-fields` | Create field (Admin/Member) |
| GET | `/projects/{projectId}/custom-fields/{id}` | Single field |
| PUT | `/projects/{projectId}/custom-fields/{id}` | Update (Admin/Member) |
| DELETE | `/projects/{projectId}/custom-fields/{id}` | Delete (Admin only) |

### Custom Field Values — `CustomFieldValuesController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/projects/{projectId}/custom-fields/{customFieldId}/values` | Values for a field |
| POST | `/projects/{projectId}/custom-fields/{customFieldId}/values` | Set value on a task (Admin/Member) |
| GET | `/projects/{projectId}/custom-fields/{customFieldId}/values/{id}` | Single value |
| DELETE | `/projects/{projectId}/custom-fields/{customFieldId}/values/{id}` | Delete (Admin/Member) |

### Project Templates — `ProjectTemplatesController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/project-templates` | List public + own templates |
| GET | `/project-templates/{id}` | Single template |
| POST | `/project-templates` | Create template (Admin/Member) |
| PUT | `/project-templates/{id}` | Update own template (Admin/Member) |
| DELETE | `/project-templates/{id}` | Delete own template (Admin/Member) |
| POST | `/project-templates/create-project` | Create project from template (Admin/Member) |

### Tenants — `TenantsController` (Admin)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/tenants` | List tenants |
| GET | `/tenants/{id}` | Single tenant |
| POST | `/tenants` | Create tenant |
| PUT | `/tenants/{id}` | Update tenant |
| DELETE | `/tenants/{id}` | Delete tenant |

### API Keys — `ApiKeysController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/api-keys?tenantId=` | List keys (optionally filtered by tenant) |
| GET | `/api-keys/{id}` | Single key |
| POST | `/api-keys` | Create key (Admin/Member) — raw key returned once |
| DELETE | `/api-keys/{id}` | Revoke key (Admin/Member) |

### Webhooks — `WebhooksController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/webhooks?tenantId=&projectId=` | List subscriptions |
| GET | `/webhooks/{id}` | Single subscription |
| POST | `/webhooks` | Create subscription (Admin/Member) |
| PUT | `/webhooks/{id}` | Update subscription (Admin/Member) |
| DELETE | `/webhooks/{id}` | Delete subscription (Admin/Member) |
| GET | `/webhooks/{id}/deliveries` | Delivery history for a subscription |

### Background Jobs — `BackgroundJobsController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/jobs?tenantId=&status=` | List jobs |
| GET | `/jobs/{id}` | Single job |
| POST | `/jobs` | Enqueue a job (Admin/Member) |
| DELETE | `/jobs/{id}` | Delete job (Admin only) |

### Public Portal — `PublicPortalController` (allow anonymous, token-gated)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/public/projects/{projectId}` | Project metadata (requires `X-Public-Token` or `?token=`) |
| GET | `/public/projects/{projectId}/tasks` | Read-only task list |
| GET | `/public/projects/{projectId}/members` | Read-only member list |
| GET | `/public/projects/{projectId}/health` | Read-only project health |

### Notifications — `NotificationsController` (authenticated)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/notifications` | List for current user. Query: `?page=1&pageSize=20` |
| GET | `/notifications/unread-count` | Unread count |
| POST | `/notifications/{id}/read` | Mark as read |
| POST | `/notifications/read-all` | Mark all as read |

### Activity — `ActivityController` (authenticated)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/activity/task/{taskId}` | Activity for a task. Query: `?page=1&pageSize=20` |
| GET | `/activity/project/{projectId}` | Activity for a project. Query: `?page=1&pageSize=20` |

### Notifications (SignalR)
| Hub | Route |
| --- | --- |
| `NotificationHub` | `/hubs/notifications` |

---

## Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (v18+; v23 used during development)

### Run the app (recommended)
From the `Luma.Server` directory, run:

```bash
dotnet run
```

This starts the API and the Vite dev server together. Then open:

```
https://localhost:52613
```

Log in with the seeded admin (`admin@luma.com` / `Admin@123`), or register a new account
and choose a role.

> ⚠️ Keep the `dotnet run` terminal open — it hosts both the API and the SPA. If the
> backend is not running, API calls return `502 Bad Gateway` through the Vite proxy.

### Run the pieces separately (optional)
```bash
# Terminal 1 — API
cd Luma.Server
dotnet run

# Terminal 2 — SPA (proxies /api to the running API)
cd luma.client
npm install
npm run dev
```

### Build / type-check the frontend
```bash
cd luma.client
npm install
npm run build      # tsc -b && vite build
```

### Reset the database
Delete `Luma.Server/luma.db`; it will be recreated (with the seeded admin) on next `dotnet run`.

### Apply migrations only
```bash
cd Luma.Server
dotnet ef database update
```

---

## Environment / Configuration

`Luma.Server/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=luma.db"
  },
  "Jwt": {
    "Key": "<signing key — change in production>",
    "Issuer": "Luma.Server",
    "Audience": "Luma.Client"
  },
  "Sso": {
    "Authority": "<oidc issuer url>",
    "ClientId": "<client id>",
    "ClientSecret": "<client secret>",
    "CallbackPath": "/api/sso/callback",
    "Scopes": [ "openid", "profile", "email" ]
  },
  "Storage": {
    "Provider": "local",
    "Local": {
      "RootPath": "uploads"
    },
    "Minio": {
      "Endpoint": "localhost:9000",
      "AccessKey": "minioadmin",
      "SecretKey": "minioadmin",
      "Bucket": "luma-attachments",
      "UseSsl": false
    }
  },
  "Email": {
    "Provider": "none",
    "SendGrid": {
      "ApiKey": "",
      "FromEmail": "noreply@luma.com",
      "FromName": "Luma"
    },
    "Smtp": {
      "Host": "localhost",
      "Port": 587,
      "UseSsl": false,
      "UserName": "",
      "Password": "",
      "FromEmail": "noreply@luma.com",
      "FromName": "Luma"
    }
  }
}
```

The Vite dev server (`luma.client/vite.config.ts`) proxies `/api` to the ASP.NET backend
using the `ASPNETCORE_URLS` value provided by SpaProxy (default fallback
`https://localhost:7023`).

### Swagger
When running in Development, the API docs are available at the backend's Swagger UI
(e.g. `https://localhost:7023/swagger`).

---

## Notes / Roadmap
- Phase 1 covers the core MVP: auth, RBAC, projects, tasks, comments, Kanban + list views.
- Phase 2 adds collaboration: file attachments (local disk or S3/MinIO), real-time updates
  via SignalR, in-app + email (SendGrid/SMTP) notifications, and per-task/project activity
  logs.
- Phase 3 adds planning: sprints/milestones, a Gantt timeline, task dependencies with cycle
  detection, and time tracking / timesheets (accessible via the **Plan** view in a project).
- Phase 4 adds team & resource management: workload/capacity view, team calendars, custom
  fields on projects/tasks, and reusable project templates.
- Phase 5 adds reporting & insights: burndown charts, velocity tracking, project health
  dashboards, PDF/Excel exports, and a token-gated client portal for external stakeholders.
- Phase 6 adds enterprise/scale: multi-tenancy (shared-schema with `TenantId`), SSO via
  OpenID Connect, webhook subscriptions with retry/dead-letter handling, API keys for
  third-party integrations, rate limiting, and a background job queue with exponential
  backoff.
- Switching the database to SQL Server (LocalDB) is a one-line change in `appsettings.json`
  and `Program.cs` (`UseSqlite` → `UseSqlServer`).
