# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

```
ai-project-manager/
├── backend/                  # Spring Boot 3.2.5 backend (Java 17, Maven)
│   ├── src/main/java/com/terra/backend/
│   │   ├── ai/               # LLM integration (OpenAiClient, PromptTemplateBuilder)
│   │   ├── config/           # WebSocketConfig, DataInitializer
│   │   ├── controller/       # REST controllers (Auth, Project, Task, AiCommand)
│   │   ├── dto/              # LoginRequest, TokenResponse, request/response subpackages
│   │   ├── entity/           # JPA entities (User, Project, Task, Team, PendingAction, etc.)
│   │   ├── exception/        # Custom exceptions + GlobalExceptionHandler
│   │   ├── repository/       # Spring Data JPA repositories
│   │   ├── security/         # JWT filter, token provider, SecurityConfig, UserDetailsService
│   │   └── service/          # Business logic (Auth, Project, Task, AI, WebSocket, Token)
│   ├── src/test/             # Single existing test: ProjectControllerTest
│   └── src/main/resources/application.properties
├── frontend/                 # TanStack Start + React frontend (Vite, pnpm/npm)
│   ├── src/
│   │   ├── components/       # UI components (shadcn/ui), chat-bubble, app-shell
│   │   ├── lib/              # auth.tsx, api.ts, error-capture.ts, utils.ts
│   │   ├── routes/           # File-based routing (login, admin/*, manager/*, member/*)
│   │   ├── hooks/            # use-mobile.tsx
│   │   └── mocks/            # MSW handlers for dev
│   ├── e2e/                  # Playwright tests
│   └── package.json
└── jwt-spring-boot/          # Separate reusable JWT auth library (Spring Boot 3.3.5)
```

## Prerequisites

- **MariaDB** running on `localhost:3306` with database `sa`, user `sa`, password `sa`
- **Redis** running on default port (used for refresh token storage via `TokenService`)
- **Java 17+**, **Maven**, **Node.js**

## Common Commands

### Backend

```bash
cd backend

# Compile
mvn compile

# Run (starts on port 8080)
mvn spring-boot:run

# Run tests
mvn test

# Run single test
mvn test -Dtest=ProjectControllerTest

# Clean build
mvn clean compile
```

### Frontend

```bash
cd frontend

# Dev server
npm run dev        # or: pnpm dev

# Build
npm run build

# Lint
npm run lint

# Unit tests
npm run test:run

# E2E tests
npm run test:e2e
```

## Architecture Overview

### Authentication Flow

1. `POST /api/auth/login` accepts `{ email, password }` or `{ username, password }` — both work; `AuthService` tries email first, then username
2. `AuthService.login()` authenticates via Spring Security's `AuthenticationManager` → `CustomUserDetailsService`
3. `CustomUserDetailsService` looks up by email first, falls back to username
4. On success, returns JWT access token + refresh token (stored in Redis via `TokenService`)
5. Subsequent requests use `Authorization: Bearer <token>` header
6. `JwtAuthenticationFilter` validates JWT and sets `SecurityContextHolder`

### Security Configuration

- `SecurityConfig` is in `com.terra.backend.security` package (NOT `config` — that was a removed duplicate)
- Stateless sessions, CSRF disabled
- Permitted paths: `/api/auth/**`, `/api/test/**`, `/api/health`
- All other paths require authentication
- CORS allows `http://localhost:3000` and `http://localhost:5173`

### Key Design Decisions

- **Entities returned directly from controllers** (no DTO mapping for Project/Task) — `User.passwordHash`, `User.refreshToken`, and `User.sessionVersion` are `@JsonIgnore`-protected
- **`@AuthenticationPrincipal UserDetails`** is used in controllers, then resolved to `User` entity via `UserRepository.findByUsername()`
- **`AuthorizationService`** centralizes project membership checks: admins bypass, others must be the project manager or a team member
- **AI commands** go through `AiProjectManagerService` which builds a prompt with board state, sends to LLM, parses JSON response into actions (CREATE/MOVE/UPDATE/DELETE)
- **Sensitive actions** (DELETE) create `PendingAction` records requiring user confirmation
- **WebSocket** at `/ws` with STOMP, JWT auth in CONNECT headers, broadcasts to `/topic/kanban/{projectId}`

### Known Issues (from code review + testing)

1. ~~Frontend/backend field mismatch~~ — **FIXED**: `LoginRequest` now accepts both `email` and `username`
2. ~~No authorization checks~~ — **FIXED**: `AuthorizationService` enforces project membership; `ProjectController` uses `@PreAuthorize("hasRole('ADMIN')")` for list endpoint
3. ~~Password hash leakage~~ — **FIXED**: `@JsonIgnore` on `passwordHash`, `refreshToken`, `sessionVersion` in `User` entity
4. ~~No ownership validation~~ — **FIXED**: `TaskController` verifies task access via `AuthorizationService`
5. ~~Missing `@PreAuthorize`~~ — **FIXED**: Role-based checks on manager endpoints
6. ~~Duplicate `SecurityConfig`~~ — **FIXED**: Only `security/` version remains
7. **Silent exception swallowing in `validateToken`**: Now logs warnings but still doesn't differentiate between expired/malformed/wrong-key tokens
8. **No DTO for Project responses**: Project entity returned directly — could expose internal fields if new sensitive fields are added without `@JsonIgnore`

### Database

- MariaDB with `spring.jpa.hibernate.ddl-auto=update` — tables auto-created on startup
- `DataInitializer` seeds 3 users (admin/manager/member, all password: `password`), 1 team, 2 projects, 2 tasks
- Redis stores refresh tokens with key prefix `refresh_token:{email}`

### JWT Configuration

- Secret and expiration in `application.properties` (`jwt.secret`, `jwt.expirationMs=86400000`)
- Refresh token TTL: 7 days (`jwt.refreshExpirationMs=604800000`)
- Token subject = username (not email)

### AI Integration

- `OpenAiClient` implements `LlmClient` interface
- When no API key is configured, returns mock responses
- `PromptTemplateBuilder` constructs system prompt with board state, team roster, and user command
- `AiInsightsEngine` provides scheduled bottleneck analysis (cron-based)
