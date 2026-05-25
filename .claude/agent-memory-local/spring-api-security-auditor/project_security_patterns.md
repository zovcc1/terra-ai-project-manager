---
name: project-security-patterns
description: Security patterns, vulnerabilities, and architecture decisions found in the Terra Spring Boot backend
metadata:
  type: project
---

# Terra Backend Security Patterns (2026-05-25)

## Architecture

- Spring Boot 3.2.5, Java 17, Maven
- JWT auth (accessToken + refreshToken in Redis)
- MariaDB with `ddl-auto=update`
- WebSocket/STOMP at `/ws`
- AI integration via OpenAiClient (mock mode when no API key)
- CORS: localhost:3000, localhost:5173

## Recurring Vulnerability Patterns

### Hardcoded Secrets
- `jwt.secret` in `application.properties` -- long but committed to VCS
- DB credentials `sa/sa` in `application.properties`
- **Pattern:** All secrets in config files, no env var fallbacks

### Missing Method-Level Security
- `TaskController` has no `@PreAuthorize` -- any authenticated user can access
- `AiCommandController` has no `@PreAuthorize` on any endpoint
- `ProjectController` only has `@PreAuthorize` on `getAllProjects()`, not on `getProjectById()`
- **Pattern:** Reliance on custom `AuthorizationService` instead of defense-in-depth with `@PreAuthorize`

### Entity-as-DTO
- `Project` entity returned directly from `ProjectController`
- **Pattern:** No mapping layer; future field additions risk data exposure

### Inconsistent Error Handling
- `AuthorizationService` throws `RuntimeException` for access denial, not `UnauthorizedException`
- `GlobalExceptionHandler` maps `RuntimeException` to HTTP 500, leaking messages
- **Pattern:** Custom exceptions exist but are not consistently used

### Missing Input Validation
- `AiCommandRequest` has no `@NotNull`/`@NotBlank` annotations
- `ConfirmActionRequest` has no validation
- `LoginRequest` has `@NotBlank` on `email` but not `username` (contradictory -- both can't be required)
- **Pattern:** DTOs lack Jakarta Validation annotations

### Dead Code
- `User.sessionVersion` field never checked in JWT validation
- `AiInsightsEngine.scheduledInsights()` is empty
- `UserSkill`, `Skill`, `Comment`, `Notification` entities defined but unused
- `CommentRepository`, `NotificationRepository`, `SkillRepository`, `UserSkillRepository` have no callers
- **Pattern:** Entities/repositories added for future use but never cleaned up

### WebSocket Security Gap
- Subscription to `/topic/kanban/{projectId}` not authorized
- Any authenticated user can subscribe to any project's board updates
- **Pattern:** Authentication without authorization at subscription level

## Security Config Decisions

- CSRF disabled (stateless API -- acceptable)
- Stateless sessions
- Permitted paths: `/api/auth/**`, `/api/test/**`, `/api/health`
- Swagger endpoints not explicitly protected
- CORS configured programmatically in `SecurityConfig`, not via `application.properties`

## Testing Approach

- Existing test uses `@WebMvcTest` with RestAssured MockMvc
- Mock beans for services, real security context via `@WithMockUser`
- Test structure: `@BeforeEach` sets up `mockMvc`, tests use `given().when().then()` pattern
