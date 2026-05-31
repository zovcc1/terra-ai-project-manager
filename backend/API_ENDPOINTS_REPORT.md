# Terra Backend — API Endpoints Full Report

> **Base URL:** `/api`
> **Auth Mechanism:** JWT (HS256) via `Authorization: Bearer <token>` header
> **Password Hashing:** BCrypt
> **Database:** MariaDB (auto DDL update)
> **State Store:** Redis (refresh tokens, ephemeral tokens, rate limiting, session versioning)
> **Server:** Spring Boot, stateless sessions

---

## Table of Contents

1. [POST /api/auth/login](#1-post-apiauthlogin)
2. [POST /api/auth/register](#2-post-apiauthregister)
3. [POST /api/auth/verify-email](#3-post-apiauthverify-email)
4. [POST /api/auth/forgot-password](#4-post-apiauthforgot-password)
5. [POST /api/auth/reset-password](#5-post-apiauthreset-password)
6. [POST /api/ai/confirm/{actionId}](#6-post-apiaiactionidconfirm)
7. [GET /api/ai/pending-actions](#7-get-apiaipending-actions)
8. [DELETE /api/ai/pending-actions/{actionId}](#8-delete-apiaipending-actionsactionid)

---

## 1. POST /api/auth/login

### Overview

Authenticates a user by email or username and password. Returns a JWT access token, a refresh token, and basic user info.

| Property | Value |
|---|---|
| **URL** | `/api/auth/login` |
| **Method** | `POST` |
| **Auth Required** | No (public endpoint) |
| **Content-Type** | `application/json` |
| **Rate Limited** | Yes — 5 attempts per 60 seconds per email/username |

### Request Body

**Class:** `LoginRequest`

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `username` | `String` | No | — | Username for login. Either `username` or `email` must be provided. |
| `email` | `String` | No | — | Email for login. Either `username` or `email` must be provided. |
| `password` | `String` | **Yes** | `@NotBlank` | The user's plaintext password. |

**Note:** The controller resolves `email` first if both are provided (`loginRequest.getEmail() != null ? loginRequest.getEmail() : loginRequest.getUsername()`).

**Example:**
```json
{
  "email": "admin@terra.com",
  "password": "password"
}
```

### Success Response — `200 OK`

**Class:** `TokenResponse`

| Field | Type | Description |
|---|---|---|
| `token` | `String` | JWT access token (HS256 signed). |
| `refreshToken` | `String` | JWT refresh token (longer-lived). |
| `type` | `String` | Always `"Bearer"`. |
| `id` | `Long` | User's database ID. |
| `email` | `String` | User's email address. |
| `roles` | `List<String>` | List containing the user's role name (currently always exactly one element). |

**Example:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
  "type": "Bearer",
  "id": 1,
  "email": "admin@terra.com",
  "roles": ["ADMIN"]
}
```

### Error Responses

| Status | Condition | Response Body |
|---|---|---|
| `401 Unauthorized` | Bad credentials (wrong email/username or password) | `{"error": "Unauthorized", "message": "Invalid username or password", "timestamp": "..."}` |
| `404 Not Found` | User not found in database after authentication | `{"error": "Not Found", "message": "User not found: ...", "timestamp": "..."}` |
| `429 Too Many Requests` | More than 5 login attempts within 60 seconds for the same email/username | `{"error": "Too Many Requests", "message": "Too many login attempts. Try again later.", "timestamp": "..."}` |
| `400 Bad Request` | `@NotBlank` validation fails on `password` | Spring default validation error |
| `500 Internal Server Error` | Any other unexpected runtime exception | `{"error": "Internal Server Error", "message": "...", "timestamp": "..."}` |

### Detailed Flow

1. **Rate limit check:** Redis key `ratelimit:login:<emailOrUsername>` is incremented. If count > 5 within the 60-second window, `TooManyRequestsException` is thrown → `429`.
2. **Authentication:** Spring Security's `AuthenticationManager` (using `DaoAuthenticationProvider` with `BCryptPasswordEncoder`) authenticates via `UsernamePasswordAuthenticationToken`. The `CustomUserDetailsService` looks up the user by email first, then falls back to username.
3. **JWT generation:** `JwtTokenProvider.generateToken()` creates an HS256 JWT with the username as subject, signed with the configured `jwt.secret`. Expiration is `jwt.expirationMs` (default: **86400000ms = 24 hours**).
4. **Refresh token generation:** `JwtTokenProvider.generateRefreshToken()` creates a second JWT with expiration `jwt.refreshExpirationMs` (default: **604800000ms = 7 days**).
5. **Token storage:** The refresh token is stored in Redis under key `auth:refresh:<userId>` with 7-day TTL, and also stored via `TokenService`.
6. **User lookup:** The user is fetched from the database by email (or username).
7. **Response:** Returns `TokenResponse` with the access token, refresh token, user ID, email, and roles list.

### Security Notes

- Passwords are hashed with BCrypt before storage.
- Rate limiting prevents brute-force attacks on the login endpoint.
- The endpoint is publicly accessible (`/api/auth/**` is permitted in `SecurityConfig`).
- **⚠ Open Question:** The login does **not** check the user's `status` field (`ACTIVE`, `PENDING`, `SUSPENDED`). A `PENDING` (email-unverified) or `SUSPENDED` user can currently log in successfully. This may be intentional or may need a status gate.

---

## 2. POST /api/auth/register

### Overview

Registers a new user account. The user is created with `PENDING` status and must verify their email before the account becomes `ACTIVE`. A verification token is "sent" via the `EmailService` (currently a stub that logs to console).

| Property | Value |
|---|---|
| **URL** | `/api/auth/register` |
| **Method** | `POST` |
| **Auth Required** | No (public endpoint) |
| **Content-Type** | `application/json` |

### Request Body

**Class:** `RegisterRequest`

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `username` | `String` | **Yes** | `@NotBlank` | Desired username. Must be unique. |
| `email` | `String` | **Yes** | `@NotBlank`, `@Email` | Email address. Must be unique and valid format. |
| `password` | `String` | **Yes** | `@NotBlank`, `@Size(min=6, max=100)` | Plaintext password. Min 6 chars, max 100 chars. |
| `fullName` | `String` | **Yes** | `@NotBlank` | User's full display name. |

**Example:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123",
  "fullName": "John Doe"
}
```

### Success Response — `201 Created`

```json
{
  "message": "Registered. Verify your email."
}
```

### Error Responses

| Status | Condition | Response Body |
|---|---|---|
| `409 Conflict` | Email already registered | `{"error": "Email already registered"}` |
| `409 Conflict` | Username already taken | `{"error": "Username already taken"}` |
| `400 Bad Request` | Validation fails (blank fields, invalid email, password too short) | Spring default validation error |
| `500 Internal Server Error` | Unexpected runtime exception | `{"error": "Internal Server Error", "message": "...", "timestamp": "..."}` |

### Detailed Flow

1. **Duplicate check:** Checks if `email` already exists in `users` table → `409` if found.
2. **Duplicate check:** Checks if `username` already exists in `users` table → `409` if found.
3. **User creation:** Creates a `User` entity with:
   - `passwordHash` = BCrypt-encoded password
   - `role` = `Role.USER`
   - `status` = `User.UserStatus.PENDING`
   - `createdAt` / `updatedAt` set automatically via `@PrePersist`
4. **Verification token:** Generates a `UUID.randomUUID().toString()` token, stores it in Redis under key `auth:ephemeral:verify:<email>` with TTL of **900000ms (15 minutes)**.
5. **Email dispatch:** Calls `EmailService.sendVerificationEmail(email, token)` — currently a **stub** that only logs the token to the console. No actual SMTP is configured.
6. **Response:** Returns `201` with a message prompting email verification.

### Security Notes

- Passwords are never stored in plaintext; BCrypt is used.
- The verification token is a random UUID stored in Redis with a 15-minute TTL.
- **⚠ Note:** The `EmailService` is a stub. In production, you need to configure `spring.mail.*` properties and implement actual email sending with a proper email template.

---

## 3. POST /api/auth/verify-email

### Overview

Verifies a user's email address using the token that was "sent" during registration. Upon success, the user's status changes from `PENDING` to `ACTIVE`.

| Property | Value |
|---|---|
| **URL** | `/api/auth/verify-email` |
| **Method** | `POST` |
| **Auth Required** | No (public endpoint) |
| **Content-Type** | `application/json` |

### Request Body

**Class:** `VerifyEmailRequest`

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `email` | `String` | **Yes** | `@NotBlank` | The email address to verify. |
| `token` | `String` | **Yes** | `@NotBlank` | The verification token received via email. |

**Example:**
```json
{
  "email": "john@example.com",
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Success Response — `200 OK`

```json
{
  "message": "Email verified. You may now log in."
}
```

### Error Responses

| Status | Condition | Response Body |
|---|---|---|
| `400 Bad Request` | Token is invalid, expired, or doesn't match | `{"error": "Invalid or expired token"}` |
| `500 Internal Server Error` | User not found in database (shouldn't happen if token exists) | `{"error": "Internal Server Error", "message": "User not found", "timestamp": "..."}` |
| `400 Bad Request` | Validation fails (blank fields) | Spring default validation error |

### Detailed Flow

1. **Token lookup:** Retrieves the stored token from Redis key `auth:ephemeral:verify:<email>`.
2. **Token validation:** If the stored token is `null` (expired or never existed) or doesn't match the submitted token → `400`.
3. **User activation:** Fetches the user by email, sets `status` to `User.UserStatus.ACTIVE`, saves to database.
4. **Token cleanup:** Deletes the Redis key `auth:ephemeral:verify:<email>`.
5. **Response:** Returns `200` with success message.

### Security Notes

- Token TTL is 15 minutes (set during registration).
- The token is deleted from Redis after successful verification, preventing reuse.
- No authentication required — the token itself is the proof of ownership.

---

## 4. POST /api/auth/forgot-password

### Overview

Initiates a password reset flow. If the email exists in the system, a reset token is generated and "sent" via email. **Always returns `200` regardless of whether the email exists** to prevent email enumeration attacks.

| Property | Value |
|---|---|
| **URL** | `/api/auth/forgot-password` |
| **Method** | `POST` |
| **Auth Required** | No (public endpoint) |
| **Content-Type** | `application/json` |

### Request Body

**Class:** `ForgotPasswordRequest`

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `email` | `String` | **Yes** | `@NotBlank` | The email address of the account to reset. |

**Example:**
```json
{
  "email": "john@example.com"
}
```

### Success Response — `200 OK`

```json
{
  "message": "If an account exists, a reset link has been sent."
}
```

**This response is returned whether or not the email exists in the system.**

### Error Responses

| Status | Condition | Response Body |
|---|---|---|
| `400 Bad Request` | Validation fails (blank email) | Spring default validation error |
| `500 Internal Server Error` | Unexpected runtime exception | `{"error": "Internal Server Error", "message": "...", "timestamp": "..."}` |

### Detailed Flow

1. **User lookup:** Searches for user by email using `userRepository.findByEmail()`.
2. **If user exists:**
   - Generates a `UUID.randomUUID().toString()` reset token.
   - Stores it in Redis under key `auth:ephemeral:reset:<email>` with TTL of **3600000ms (1 hour)**.
   - Calls `EmailService.sendPasswordResetEmail(email, token)` — currently a **stub** that only logs to console.
3. **If user does nothing is done (no error thrown).**
4. **Response:** Always returns `200` with the same generic message.

### Security Notes

- **Email enumeration prevention:** The endpoint always returns `200` with an identical message, so attackers cannot determine if an email is registered.
- Reset token TTL is 1 hour.
- **⚠ Note:** Same as registration — the `EmailService` is a stub. Production requires SMTP configuration.

---

## 5. POST /api/auth/reset-password

### Overview

Completes the password reset flow by submitting the reset token and a new password.

| Property | Value |
|---|---|
| **URL** | `/api/auth/reset-password` |
| **Method** | `POST` |
| **Auth Required** | No (public endpoint) |
| **Content-Type** | `application/json` |

### Request Body

**Class:** `ResetPasswordRequest`

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `email` | `String` | **Yes** | `@NotBlank` | The email address being reset. |
| `token` | `String` | **Yes** | `@NotBlank` | The reset token received via email. |
| `newPassword` | `String` | **Yes** | `@NotBlank`, `@Size(min=6, max=100)` | The new password. Min 6 chars, max 100 chars. |

**Example:**
```json
{
  "email": "john@example.com",
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "newPassword": "newSecret456"
}
```

### Success Response — `200 OK`

```json
{
  "message": "Password reset successfully."
}
```

### Error Responses

| Status | Condition | Response Body |
|---|---|---|
| `400 Bad Request` | Token is invalid, expired, or doesn't match | `{"error": "Invalid or expired token"}` |
| `500 Internal Server Error` | User not found in database | `{"error": "Internal Server Error", "message": "User not found", "timestamp": "..."}` |
| `400 Bad Request` | Validation fails (blank fields, password too short) | Spring default validation error |

### Detailed Flow

1. **Token lookup:** Retrieves the stored token from Redis key `auth:ephemeral:reset:<email>`.
2. **Token validation:** If the stored token is `null` (expired) or doesn't match → `400`.
3. **Password update:** Fetches the user by email, sets `passwordHash` to BCrypt-encoded `newPassword`, saves to database.
4. **Token cleanup:** Deletes the Redis key `auth:ephemeral:reset:<email>`.
5. **Response:** Returns `200` with success message.

### Security Notes

- Reset token TTL is 1 hour.
- The token is deleted from Redis after use, preventing reuse.
- New password must be 6–100 characters.
- Old password is immediately invalidated (BCrypt hash replaced).

---

## 6. POST /api/ai/confirm/{actionId}

### Overview

Confirms or rejects a pending AI action. When approved, the action's associated operation is executed (currently only `DELETE_TASK` / `DELETE` actions are handled). When rejected, the action is simply marked as rejected.

| Property | Value |
|---|---|
| **URL** | `/api/ai/confirm/{actionId}` |
| **Method** | `POST` |
| **Auth Required** | **Yes** — JWT Bearer token |
| **Authorization** | `@PreAuthorize("isAuthenticated()")` + user must own the action |
| **Path Variable** | `actionId` (`Long`) — The ID of the pending action |
| **Content-Type** | `application/json` |

### Request Body

**Class:** `ConfirmActionRequest`

| Field | Type | Required | Validation | Description |
|---|---|---|---|---|
| `approved` | `boolean` | No (defaults to `false`) | — | `true` to approve/execute the action, `false` to reject it. |

**Example (approve):**
```json
{
  "approved": true
}
```

**Example (reject):**
```json
{
  "approved": false
}
```

### Success Response — `200 OK`

Empty body (`ResponseEntity.ok().build()`).

### Error Responses

| Status | Condition | Response Body |
|---|---|---|
| `401 Unauthorized` | No JWT token or invalid/expired token | Handled by `AuthEntryPointJwt` |
| `403 Forbidden` | User authenticated but lacks permission | Handled by `JwtAccessDeniedHandler` |
| `404 Not Found` | Pending action with given `actionId` does not exist | `{"error": "Not Found", "message": "Pending action not found", "timestamp": "..."}` |
| `500 Internal Server Error` | User not found in database | `{"error": "Internal Server Error", "message": "User not found", "timestamp": "..."}` |
| `500 Internal Server Error` | Authenticated user does not own the pending action | `{"error": "Internal Server Error", "message": "Unauthorized to handle this action", "timestamp": "..."}` |

### Detailed Flow

1. **Authentication:** JWT is validated by `JwtAuthenticationFilter`. The user's `UserDetails` (username + role) is extracted.
2. **User resolution:** The `User` entity is fetched from the database by username.
3. **Action lookup:** `PendingAction` is fetched by `actionId`. If not found → `404`.
4. **Ownership check:** If `action.getUser().getId() != userId` → throws `RuntimeException("Unauthorized to handle this action")` → `500`.
5. **Approval handling:**
   - If `approved == true`: Sets status to `APPROVED`. If the action type is `DELETE_TASK` or `DELETE` and `targetId` is not null, calls `taskService.deleteTask(targetId)`.
   - If `approved == false`: Sets status to `REJECTED`. No further action.
6. **Save:** The updated `PendingAction` is saved to the database.
7. **Response:** Returns `200 OK` with empty body.

### ⚠ Known Limitation

The `handlePendingAction` method **only executes `DELETE_TASK` / `DELETE` actions** when approved. For all other action types (`CREATE`, `UPDATE`, `MOVE`, `ASSIGN`), the pending action is marked as `APPROVED` but **no actual operation is performed**. This is because the full LLM action data (title, description, status, priority, assigneeId, dueDate) is **not serialized into the `PendingAction.proposedData` JSON field** when the pending action is created. The `PendingAction` entity only stores `actionType` and `targetId`, so there is insufficient data to reconstruct CREATE/UPDATE/MOVE/ASSIGN operations at confirmation time.

---

## 7. GET /api/ai/pending-actions

### Overview

Retrieves all pending AI actions for the currently authenticated user. Only actions with status `PENDING` are returned.

| Property | Value |
|---|---|
| **URL** | `/api/ai/pending-actions` |
| **Method** | `GET` |
| **Auth Required** | **Yes** — JWT Bearer token |
| **Authorization** | `@PreAuthorize("isAuthenticated()")` |
| **Query Parameters** | None |

### Success Response — `200 OK`

**Type:** `List<PendingActionResponse>`

| Field | Type | Description |
|---|---|---|
| `id` | `Long` | The pending action's database ID. |
| `userId` | `Long` | The ID of the user who owns this action. |
| `actionType` | `String` | The type of action (e.g., `DELETE`, `DELETE_TASK`, `CREATE`, `UPDATE`, `MOVE`, `ASSIGN`). |
| `targetId` | `Long` | The ID of the target entity (e.g., task ID). Nullable. |
| `naturalLanguageCommand` | `String` | The original user message that triggered this action. |
| `status` | `String` | The action's status (always `"PENDING"` for this endpoint). |

**Example:**
```json
[
  {
    "id": 1,
    "userId": 3,
    "actionType": "DELETE_TASK",
    "targetId": 42,
    "naturalLanguageCommand": "Delete the old setup task",
    "status": "PENDING"
  }
]
```

### Error Responses

| Status | Condition | Response Body |
|---|---|---|
| `401 Unauthorized` | No JWT token or invalid/expired token | Handled by `AuthEntryPointJwt` |
| `403 Forbidden` | User authenticated but lacks permission | Handled by `JwtAccessDeniedHandler` |
| `500 Internal Server Error` | User not found in database | `{"error": "Internal Server Error", "message": "User not found", "timestamp": "..."}` |

### Detailed Flow

1. **Authentication:** JWT is validated, user is resolved from database.
2. **Query:** Calls `pendingActionRepository.findByUserIdAndStatus(userId, PendingAction.ActionStatus.PENDING)`.
3. **Mapping:** Each `PendingAction` entity is mapped to `PendingActionResponse` via `PendingActionResponse.fromEntity()`.
4. **Response:** Returns `200 OK` with the list (empty array `[]` if no pending actions).

### ⚠ Notes

- Results are **scoped to the authenticated user only**. Even ADMIN users only see their own pending actions.
- The `PendingAction` entity has an `expiresAt` field (set to `now + 15 minutes` at creation), but the query does **not** filter out expired actions. Expired actions will still appear in the list unless a cleanup job removes them.
- **⚠ Open Question:** A `ai.pending.cleanup.cron` property is configured (`0 */5 * * * *` = every 5 minutes), but no scheduler class was found that uses it. Pending action expiration may be a planned feature that is not yet implemented.

---

## 8. DELETE /api/ai/pending-actions/{actionId}

### Overview

Rejects a pending AI action by its ID. This is functionally equivalent to calling `POST /api/ai/confirm/{actionId}` with `{"approved": false}`.

| Property | Value |
|---|---|
| **URL** | `/api/ai/pending-actions/{actionId}` |
| **Method** | `DELETE` |
| **Auth Required** | **Yes** — JWT Bearer token |
| **Authorization** | `@PreAuthorize("isAuthenticated()")` + user must own the action |
| **Path Variable** | `actionId` (`Long`) — The ID of the pending action to reject |
| **Request Body** | None |

### Success Response — `200 OK`

Empty body (`ResponseEntity.ok().build()`).

### Error Responses

| Status | Condition | Response Body |
|---|---|---|
| `401 Unauthorized` | No JWT token or invalid/expired token | Handled by `AuthEntryPointJwt` |
| `403 Forbidden` | User authenticated but lacks permission | Handled by `JwtAccessDeniedHandler` |
| `404 Not Found` | Pending action with given `actionId` does not exist | `{"error": "Not Found", "message": "Pending action not found", "timestamp": "..."}` |
| `500 Internal Server Error` | User not found in database | `{"error": "Internal Server Error", "message": "User not found", "timestamp": "..."}` |
| `500 Internal Server Error` | Authenticated user does not own the pending action | `{"error": "Internal Server Error", "message": "Unauthorized to handle this action", "timestamp": "..."}` |

### Detailed Flow

1. **Authentication:** JWT is validated, user is resolved from database.
2. **Delegation:** Calls `aiProjectManagerService.handlePendingAction(actionId, userId, false)` — identical to the confirm endpoint with `approved = false`.
3. **Action lookup:** `PendingAction` is fetched by `actionId`. If not found → `404`.
4. **Ownership check:** If `action.getUser().getId() != userId` → `500`.
5. **Rejection:** Sets status to `REJECTED`, saves to database.
6. **Response:** Returns `200 OK` with empty body.

### ⚠ Note

This endpoint is **functionally identical** to `POST /api/ai/confirm/{actionId}` with `{"approved": false}`. Both call the same `handlePendingAction` method with `approved = false`. The DELETE endpoint exists as a convenience/REST-idiomatic way to remove a pending action.

---

## Cross-Cutting Concerns

### JWT Configuration

| Property | Config Key | Default Value | Description |
|---|---|---|---|
| Secret | `jwt.secret` | From `JWT_SECRET` env var | HS256 signing key |
| Access Token TTL | `jwt.expirationMs` | `86400000` (24 hours) | JWT access token lifetime |
| Refresh Token TTL | `jwt.refreshExpirationMs` | `604800000` (7 days) | JWT refresh token lifetime |

### Security Configuration

- **CSRF:** Disabled (stateless JWT).
- **CORS:** Configured via `cors.allowed.origins` (default: `http://localhost:3000`). Allows `GET, POST, PUT, DELETE, PATCH, OPTIONS`. Allows `Authorization` and `Content-Type` headers. Credentials allowed.
- **Session:** Stateless (`SessionCreationPolicy.STATELESS`).
- **Public endpoints:** `/api/auth/**`, `/api/test/**`, `/api/health`.
- **All other endpoints:** Require authentication.

### Error Response Format

All error responses follow a consistent JSON structure:

```json
{
  "error": "<Error Category>",
  "message": "<Human-readable description>",
  "timestamp": "<ISO-8601 datetime>"
}
```

### Exception → HTTP Status Mapping

| Exception Class | HTTP Status |
|---|---|
| `ResourceNotFoundException` | `404 Not Found` |
| `BadCredentialsException` | `401 Unauthorized` |
| `UsernameNotFoundException` | `404 Not Found` |
| `UnauthorizedException` | `403 Forbidden` |
| `TooManyRequestsException` | `429 Too Many Requests` |
| `AiProcessingException` | `500 Internal Server Error` |
| `RuntimeException` (catch-all) | `500 Internal Server Error` |

### User Roles

| Enum Value | Description |
|---|---|
| `ADMIN` | System administrator. Bypasses project membership checks in AI service. |
| `MANAGER` | Project manager. |
| `MEMBER` | Team member. |
| `USER` | Default role assigned at registration. |

### User Statuses

| Enum Value | Description |
|---|---|
| `PENDING` | Registered but email not yet verified. Default for new users. |
| `ACTIVE` | Email verified, account fully functional. |
| `SUSPENDED` | Account suspended. |

### Pending Action Statuses

| Enum Value | Description |
|---|---|
| `PENDING` | Awaiting user confirmation. Default at creation. |
| `APPROVED` | User confirmed the action. |
| `REJECTED` | User rejected the action. |
| `EXPIRED` | Action exceeded its 15-minute TTL. (Set in entity but no auto-expiry job found.) |

### Seeded Test Users (from `DataInitializer`)

| Username | Email | Password | Role | Status |
|---|---|---|---|---|
| `admin` | `admin@terra.com` | `password` | `ADMIN` | `ACTIVE` |
| `manager` | `manager@terra.com` | `password` | `MANAGER` | `ACTIVE` |
| `member` | `member@terra.com` | `password` | `MEMBER` | `ACTIVE` |

These are created on first startup if the `users` table is empty.

---

## Open Questions / Potential Issues

1. **`handlePendingAction` only executes DELETE** — Approved pending actions of type CREATE, UPDATE, MOVE, ASSIGN are marked `APPROVED` but not actually executed. The LLM response data is not stored in the `PendingAction`, so there's no way to reconstruct the operation at confirmation time. This appears to be a known architectural gap (there's a code comment: "A better architecture would serialize LlmActionResponse into a 'payload' field").

2. **DELETE `/api/ai/pending-actions/{actionId}` is redundant** — It's functionally identical to `POST /api/ai/confirm/{actionId}` with `{"approved": false}`. Both call the same service method.

3. **Email service is a stub** — `EmailService` only logs tokens to the console. No SMTP is configured. The verification and password reset "emails" are never actually sent.

4. **No user status check on login** — `PENDING` (unverified) and `SUSPENDED` users can log in successfully. The `AuthService.login()` method does not gate on `User.UserStatus.ACTIVE`.

5. **Pending action expiry not enforced** — Actions have an `expiresAt` field (15 minutes), but the GET endpoint doesn't filter expired actions, and no cleanup scheduler was found despite the `ai.pending.cleanup.cron` property being configured.

6. **Ownership check returns 500** — When a user tries to confirm/reject an action they don't own, a `RuntimeException` is thrown, which results in a `500 Internal Server Error`. This should arguably be a `403 Forbidden`.

7. **`roles` is always a single-element list** — `TokenResponse.roles` is `List.of(user.getRole().name())`, always containing exactly one role. The list format suggests future multi-role support, but currently it's always one element.
