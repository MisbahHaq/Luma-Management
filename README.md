# Luma — Project Management Tool

Luma is a full-stack project management application (Phase 1 / Core MVP). It lets teams
organize work into **Projects**, break them down into **Tasks** (with status, priority, due
dates, and assignees), discuss tasks through **Comments**, and visualize progress on a
**Kanban board** or a **list view**.

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
│   ├── Controllers/          # Auth, Projects, Tasks, Comments, Users
│   ├── Models/               # ApplicationUser, Project, TaskItem, Comment, Enums
│   ├── DTOs/                 # Auth, Projects, Tasks, Comments, Users
│   ├── Data/                 # AppDbContext + SeedData
│   ├── Services/             # JwtService
│   ├── Migrations/           # EF Core migrations
│   ├── appsettings.json      # ConnectionStrings + Jwt settings
│   └── luma.db               # SQLite database file (created at runtime)
└── luma.client/              # React + TypeScript + Vite SPA
    ├── src/
    │   ├── api/              # Axios client (attaches JWT)
    │   ├── components/       # KanbanBoard, TaskDetailModal
    │   ├── context/          # AuthContext (auth state)
    │   ├── pages/            # Login, Register, Dashboard, ProjectDetail
    │   └── types/            # TypeScript types mapped to C# DTOs
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

---

## Data Model

| Entity | Key fields |
| --- | --- |
| `ApplicationUser` (IdentityUser) | `FullName?`, `Role` (`Admin`/`Member`/`Viewer`) |
| `Project` | `Id`, `Name`, `Description?`, `CreatedAt`, `CreatedByUserId` → `ApplicationUser` |
| `TaskItem` | `Id`, `Title`, `Description?`, `Status` (`ToDo`/`InProgress`/`Done`), `Priority` (`Low`/`Medium`/`High`), `DueDate?`, `ProjectId` → `Project`, `AssigneeId?` → `ApplicationUser` |
| `Comment` | `Id`, `TaskId` → `TaskItem`, `UserId` → `ApplicationUser`, `Text`, `CreatedAt` |

### Relationships
- A **Project** has many **Tasks** (cascade delete).
- A **Task** has many **Comments** (cascade delete).
- A **Task** has an optional **Assignee** (set null on user delete).
- A **Project** has a **CreatedByUser** (restrict delete).

---

## Authentication & Authorization

- On **Register** / **Login**, the server validates credentials and returns a `token` (JWT)
  plus the user profile (`id`, `email`, `fullName`, `role`).
- The JWT carries the user `Id`, `Email`, and `Role` claims and is valid for 12 hours.
- The client stores the token in `localStorage` (`luma_token`, `luma_user`).

### Role-based access (RBAC)
| Capability | Admin | Member | Viewer |
| --- | --- | --- | --- |
| View projects / tasks / comments | ✅ | ✅ | ✅ |
| Create / edit / delete **Projects** | ✅ | ✅ | ❌ |
| Create / edit / delete **Tasks** | ✅ | ✅ | ❌ |
| Add **Comments** | ✅ | ✅ | ✅ |
| List **Users** (for assignment) | ✅ | ✅ | ❌ |

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

### Projects — `ProjectsController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/projects` | List all projects |
| GET | `/projects/{id}` | Single project |
| POST | `/projects` | Create (Admin/Member) |
| PUT | `/projects/{id}` | Update (Admin/Member) |
| DELETE | `/projects/{id}` | Delete (Admin only) |

### Tasks — `TasksController` (authenticated; write = Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/tasks/project/{projectId}` | Tasks for a project |
| GET | `/tasks/{id}` | Single task |
| POST | `/tasks` | Create (Admin/Member) |
| PUT | `/tasks/{id}` | Update status/priority/assignee (Admin/Member) |
| DELETE | `/tasks/{id}` | Delete (Admin/Member) |

### Comments — `CommentsController` (authenticated)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/comments/task/{taskId}` | Comments for a task |
| POST | `/comments` | Add a comment (any authenticated user) |

### Users — `UsersController` (Admin/Member)
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/users` | List users (used to populate the assignee dropdown) |

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
- Projects currently have no membership list or status of their own — assignment and status
  are modeled at the **task** level. These can be added as a follow-up.
- Switching the database to SQL Server (LocalDB) is a one-line change in `appsettings.json`
  and `Program.cs` (`UseSqlite` → `UseSqlServer`).
