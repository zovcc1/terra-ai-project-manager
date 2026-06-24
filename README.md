# Terra — AI Project Manager

A role-based, AI-assisted project management and kanban platform with a real-time
collaboration layer. The user-facing UI is in **Arabic (RTL)**.

---

## Features

- **Kanban boards** — drag-and-drop task management for managers and members
- **Projects, tasks & comments** — full CRUD with per-role visibility rules
- **Teams** — group members under a team; assign teams to projects
- **Role-based dashboards** — separate views for Admin, Manager, and Member
- **JWT authentication** — secure login, email verification, and password reset flows
- **Real-time notifications** — WebSocket/STOMP push notifications
- **AI command agent** — chat-driven assistant (via OpenRouter) that can create projects,
  tasks, and more, with explicit confirmation gates on every write operation
- **AI security hardening** — IDOR guards, prompt-injection defense (`<data>` isolation),
  and automated cleanup of stale pending commands
- **Admin panel** — system stats, user management, team management, AI provider settings
- **Analytics** — project and task charts powered by Recharts

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Spring Boot 3.2.5, Java 17, Spring Security, Spring Data JPA, Spring WebSocket, Spring Data Redis, Bean Validation |
| **Database** | MariaDB 11 |
| **Cache / State** | Redis 7 (ephemeral tokens, rate limiting) |
| **Auth** | JWT (jjwt 0.11.5), email verification, password reset |
| **API Docs** | springdoc OpenAPI 2.5 (Swagger UI) |
| **Frontend** | React 19, TanStack Start, TanStack Router, TanStack Query |
| **Build / DX** | Vite 7, Bun, TypeScript |
| **UI** | Tailwind CSS 4, Radix UI, shadcn-style components, Recharts |
| **Forms** | react-hook-form + Zod |
| **Real-time** | STOMP over SockJS |
| **AI** | OpenRouter (configurable model via admin UI) |
| **Infra** | Docker, Docker Compose |

---

## Architecture

```
┌──────────────────────┐        REST + WebSocket        ┌────────────────────────┐
│  Frontend  :3000     │ ◀────────────────────────────▶ │  Backend  :8080        │
│  React / TanStack    │                                 │  Spring Boot           │
│  Tailwind / Radix    │                                 │  Spring Security (JWT) │
└──────────────────────┘                                 └──────────┬─────────────┘
                                                                    │
                              ┌─────────────────────────────────────┼──────────────┐
                              │                                      │              │
                     ┌────────▼──────┐                    ┌─────────▼──────┐  ┌───▼──────────┐
                     │  MariaDB 11   │                    │   Redis 7      │  │  OpenRouter  │
                     │  (persistent) │                    │  (cache/state) │  │  (AI agent)  │
                     └───────────────┘                    └────────────────┘  └──────────────┘
```

The repository is a **monorepo** — `backend/` and `frontend/` are self-contained
applications orchestrated together via `docker-compose.yml` at the root.

---

## Project Structure

```
ai-project-manager/
├── backend/                  # Spring Boot API
│   ├── src/main/java/com/terra/backend/
│   │   ├── controller/       # REST controllers
│   │   ├── service/          # Business logic & AI pipeline
│   │   ├── entity/           # JPA entities & Role enum
│   │   ├── security/         # JWT filter, auth provider
│   │   └── util/
│   └── src/main/resources/
│       └── application.properties
├── frontend/                 # React / TanStack Start SPA
│   └── src/routes/
│       ├── admin/            # ai-settings, system-stats, teams, users
│       ├── manager/          # dashboard, analytics, kanban, projects, tasks
│       ├── member/           # kanban, my-tasks, projects, tasks
│       └── user/             # profile
├── docker-compose.yml
├── .env.example
├── IMPLMENTATION.md          # Internal architecture notes
└── KNOWN-ISSUE.md            # Known issues tracker
```

---

## Getting Started

### Prerequisites

**Recommended — Docker path:**
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose v2+

**Local dev path (without Docker):**
- JDK 17 + Maven
- [Bun](https://bun.sh/) (package manager for the frontend)
- A running MariaDB 11 instance
- A running Redis 7 instance

---

### Quick Start (Docker — recommended)

```bash
# 1. Clone
git clone <repo-url>
cd ai-project-manager

# 2. Create your env file
cp .env.example .env
#    Edit .env and set real values for DB_USERNAME, DB_PASSWORD, and JWT_SECRET

# 3. Start everything
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

After the containers are healthy, open the app, register an account, and have an admin
configure the AI provider key via **Admin → AI Settings**.

---

### Local Development (without Docker)

You need MariaDB and Redis already running and a `.env` (or env vars) set.

**Backend:**
```bash
cd backend
# Set env vars or export them before running
export DB_USERNAME=sa
export DB_PASSWORD=sa
export JWT_SECRET=<your-secret>

mvn spring-boot:run
```

**Frontend** (separate terminal):
```bash
cd frontend
bun install
bun run dev
```

---

## Configuration

### Environment Variables (`.env` / root)

| Variable | Description |
|----------|-------------|
| `DB_USERNAME` | MariaDB user |
| `DB_PASSWORD` | MariaDB password |
| `JWT_SECRET` | HS256 secret — use a long random hex string in production |

> **AI provider key** is **not** set via env. It is stored encrypted at runtime through the
> **Admin → AI Settings** UI after first login.

### Notable `application.properties` Keys

| Key | Default | Notes |
|-----|---------|-------|
| `server.port` | `8080` | Backend port |
| `spring.datasource.url` | MariaDB JDBC URL | Set via compose / env |
| `spring.data.redis.host` | `localhost` | Redis host |
| `ai.openai.api.url` | OpenRouter base URL | Configurable |
| `ai.encryption.key` | — | Key used to encrypt the stored AI API key |
| `cors.allowed.origin` | — | Frontend origin for CORS |
| `login.rate.limit.*` | — | Brute-force protection settings |

---

## Roles

| Role | Access |
|------|--------|
| `ADMIN` | Full access — user management, team management, system stats, AI settings |
| `MANAGER` | Create/manage projects, assign tasks, view analytics, use AI agent |
| `MEMBER` | View assigned projects, update own tasks, kanban board |
| `USER` | Base role assigned on registration (upgraded by admin) |

---

## Scripts & Commands

### Frontend (`cd frontend`)

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server on :3000 |
| `bun run build` | Production build |
| `bun run lint` | ESLint check |
| `bun run format` | Prettier format |
| `bun run test` | Unit tests (Vitest) |
| `bun run test:e2e` | End-to-end tests (Playwright) |

### Backend (`cd backend`)

| Command | Description |
|---------|-------------|
| `mvn spring-boot:run` | Start dev server on :8080 |
| `mvn test` | Run JUnit / REST-assured tests |
| `mvn package` | Build a runnable JAR |

---

## API Documentation

When the backend is running, interactive API docs are available at:

- **Swagger UI** — http://localhost:8080/swagger-ui.html
- **OpenAPI JSON** — http://localhost:8080/api-docs

---

## Security Notes

- All AI agent write operations (create project, create task, etc.) require an explicit
  **user confirmation step** before execution.
- Object-level authorization (`AuthorizationService`) prevents IDOR attacks on every
  agent-triggered action.
- User-supplied data passed to the AI model is wrapped in `<data>` tags to isolate it from
  the system prompt, mitigating prompt-injection risks.
- Stale pending AI commands are cleaned up on a scheduled cron job.
- Login attempts are rate-limited via Redis.

See [`IMPLMENTATION.md`](./IMPLMENTATION.md) for architecture decisions and
[`KNOWN-ISSUE.md`](./KNOWN-ISSUE.md) for the current known-issues tracker.

---

## License

No license specified — all rights reserved.
