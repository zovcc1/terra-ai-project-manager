# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-07-09T10:30:20.651Z
> Files: 255 tracked | Anatomy hits: 0 | Misses: 0

## ../../../../../tmp/claude-1000/-home-kasem-Documents-freelance-ai-project-manager/0d6c237f-9b34-4416-afe9-3795ce580951/scratchpad/

- `relaunch_backend.sh` (~117 tok)

## ../../../.claude/plans/

- `check-all-websocket-problems-enchanted-matsumoto.md` — Plan: Source AI model & endpoint from the DB (`ai_settings`) instead of `application.properties` (~1587 tok)
- `make-readme-md-for-the-steady-glade.md` — Plan: Create `README.md` for the project (~1494 tok)
- `plan-to-add-deepseek-warm-wren.md` — Plan: DeepSeek + custom API URL in AI settings, and a working header search (~1639 tok)
- `push-changes-to-docker-transient-ullman.md` — Plan: Push current changes to Docker Hub (~698 tok)
- `push-docker-backend-to-wild-hickey.md` — Plan: Push backend Docker image to `zovcc1/backend:latest` (~602 tok)
- `suggest-the-fix-for-delightful-anchor.md` — Fix: Real-time comments on the member side (~1808 tok)
- `the-comment-issue-inside-lexical-dragon.md` — Fix: real-time comments stop arriving after a WebSocket reconnect (~1393 tok)
- `we-need-to-fix-rippling-toucan.md` — Fix real-time comments & @mention notifications (~1851 tok)

## ./

- `.gitattributes` — Git attributes (~5 tok)
- `.gitignore` — Git ignore rules (~35 tok)
- `CLAUDE.md` — OpenWolf (~57 tok)
- `docker-compose.yml` — Docker Compose services (~383 tok)
- `IMPLMENTATION.md` — IMPLEMENTATION.md — AI Command System Audit Fix Plan (~3942 tok)
- `KNOWN-ISSUE.md` — KNOWN-ISSUE.md — AI Command System Design Audit (~2889 tok)
- `README.md` — Project documentation (~2049 tok)

## .claude/

- `settings.json` (~441 tok)

## .claude/rules/

- `openwolf.md` (~313 tok)

## .gemini/

- `settings.local.json` (~230 tok)

## .gemini/agent-memory-local/spring-api-security-auditor/

- `MEMORY.md` (~34 tok)
- `project_security_patterns.md` — Terra Backend Security Patterns (2026-05-25) (~755 tok)

## .gemini/agents/

- `spring-api-security-auditor.md` — Persistent Agent Memory (~4970 tok)

## .serena/

- `.gitignore` — Git ignore rules (~7 tok)
- `project.local.yml` — This file allows you to locally override settings in project.yml for development purposes. (~115 tok)
- `project.yml` — the name by which the project can be referenced within Serena (~2152 tok)

## backend/

- `.dockerignore` — Docker ignore rules (~4 tok)
- `API_ENDPOINTS_REPORT.md` — Terra Backend — API Endpoints Full Report (~6784 tok)
- `backend.iml` (~202 tok)
- `docker-entrypoint.sh` (~190 tok)
- `Dockerfile` — Docker container definition (~38 tok)
- `error-log.md` — Declares com (~6832 tok)
- `pom.xml` — Maven project configuration (~975 tok)

## backend/src/main/java/com/terra/backend/

- `TerraBackendApplication.java` — TerraBackendApplication: main (~120 tok)

## backend/src/main/java/com/terra/backend/ai/

- `LlmClient.java` — Class: LlmClient (~31 tok)
- `OpenAiClient.java` — LlmClient impl; calls `AiSettingsService.getActiveLlmConfig()` for apiKey/model/apiUrl (DB-backed, no `@Value` model/url anymore) (~674 tok)
- `PromptTemplateBuilder.java` — Component: PromptTemplateBuilder (~10827 tok)

## backend/src/main/java/com/terra/backend/ai/dto/

- `LlmActionResponse.java` — Class: LlmActionResponse (~158 tok)

## backend/src/main/java/com/terra/backend/config/

- `DataInitializer.java` — Configuration: DataInitializer (~1307 tok)
- `RedisConfig.java` — Configuration for Redis beans used throughout the application. (~390 tok)
- `WebSocketConfig.java` — Configuration: WebSocketConfig (~965 tok)

## backend/src/main/java/com/terra/backend/controller/

- `AdminStatsController.java` — RestController: AdminStatsController (2 endpoints) (~746 tok)
- `AgentChatController.java` — RestController: AgentChatController (5 endpoints) (~856 tok)
- `AiSettingsController.java` — RestController: AiSettingsController (3 endpoints) (~292 tok)
- `AuthController.java` — RestController: AuthController (6 endpoints) (~1654 tok)
- `CommentController.java` — RestController: CommentController (5 endpoints) (~1135 tok)
- `NotificationController.java` — RestController: NotificationController (4 endpoints) (~740 tok)
- `ProjectController.java` — RestController: ProjectController (10 endpoints) (~2204 tok)
- `TaskController.java` — RestController: TaskController (9 endpoints). getTaskById now enforces @authorizationService.hasTaskAccess (was role-only) (~1267 tok)
- `TeamController.java` — RestController: TeamController (6 endpoints) (~711 tok)
- `UserAdminController.java` — RestController: UserAdminController (6 endpoints) (~1034 tok)

## backend/src/main/java/com/terra/backend/dto/

- `LoginRequest.java` — Class: LoginRequest (~98 tok)
- `TokenResponse.java` — Class: TokenResponse (~108 tok)

## backend/src/main/java/com/terra/backend/dto/request/

- `AdminUpdateUserRequest.java` — Class: AdminUpdateUserRequest (~158 tok)
- `AiCommandRequest.java` — Class: AiCommandRequest (~76 tok)
- `AiSettingsRequest.java` — Class: AiSettingsRequest (~73 tok)
- `CommentRequest.java` — Class: CommentRequest (~38 tok)
- `ConfirmActionRequest.java` — Class: ConfirmActionRequest (~39 tok)
- `CreateProjectRequest.java` — Class: CreateProjectRequest (~79 tok)
- `CreateTeamRequest.java` — Class: CreateTeamRequest (~109 tok)
- `ForgotPasswordRequest.java` — Class: ForgotPasswordRequest (~56 tok)
- `MarkNotificationReadRequest.java` — Class: MarkNotificationReadRequest (~51 tok)
- `RegisterRequest.java` — Class: RegisterRequest (~129 tok)
- `ResetPasswordRequest.java` — Class: ResetPasswordRequest (~102 tok)
- `UpdateProjectRequest.java` — Class: UpdateProjectRequest (~87 tok)
- `UpdateTeamRequest.java` — Class: UpdateTeamRequest (~109 tok)
- `VerifyEmailRequest.java` — Class: VerifyEmailRequest (~67 tok)

## backend/src/main/java/com/terra/backend/dto/response/

- `AdminUserResponse.java` — AdminUserResponse: fromEntity (~208 tok)
- `AiCommandResponse.java` — Class: AiCommandResponse (~238 tok)
- `AiSettingsResponse.java` — Class: AiSettingsResponse (~84 tok)
- `AiSuggestionLogResponse.java` — Class: AiSuggestionLogResponse (~32 tok)
- `CommentResponse.java` — CommentResponse: fromEntity (~224 tok)
- `IntentResponse.java` — Class: IntentResponse (~63 tok)
- `NotificationResponse.java` — NotificationResponse: fromEntity (~282 tok)
- `PendingActionResponse.java` — PendingActionResponse: fromEntity (~258 tok)
- `ProjectResponse.java` — ProjectResponse: fromEntity (~474 tok)
- `SystemStatsResponse.java` — Class: SystemStatsResponse (~76 tok)
- `TaskResponse.java` — TaskResponse: fromEntity (~316 tok)
- `TeamResponse.java` — TeamResponse: fromEntity (~310 tok)
- `UserResponse.java` — UserResponse: from (~321 tok)

## backend/src/main/java/com/terra/backend/entity/

- `ActionType.java` — Class: ActionType (~32 tok)
- `AiSettings.java` — Entity: AiSettings. Now has `apiUrl` (`api_url` column, auto-migrated via ddl-auto=update) — custom API endpoint override, used when set instead of the provider→URL map (~170 tok)
- `AiSuggestionLog.java` — Entity: AiSuggestionLog (~287 tok)
- `Comment.java` — Entity: Comment (~205 tok)
- `Notification.java` — Entity: Notification (~302 tok)
- `PendingAction.java` — Entity: PendingAction (~291 tok)
- `Project.java` — Entity: Project (~378 tok)
- `Role.java` — Class: Role (~29 tok)
- `Task.java` — Entity: Task (~428 tok)
- `Team.java` — Entity: Team (~267 tok)
- `User.java` — Entity: User (~400 tok)

## backend/src/main/java/com/terra/backend/exception/

- `AiProcessingException.java` — Class: AiProcessingException (~83 tok)
- `AlreadyExisitException.java` — Class: AlreadyExisitException (~48 tok)
- `ConflictException.java` — Class: ConflictException (~47 tok)
- `GlobalExceptionHandler.java` — RestController: GlobalExceptionHandler. Now has dedicated @ExceptionHandler(AccessDeniedException.class) -> 403, so it's no longer swallowed by the RuntimeException->500 catch-all (~1124 tok)
- `LlmClientException.java` — Class: LlmClientException (~57 tok)
- `ResourceNotFoundException.java` — Class: ResourceNotFoundException (~55 tok)
- `TooManyRequestsException.java` — Class: TooManyRequestsException (~54 tok)
- `UnauthorizedException.java` — Class: UnauthorizedException (~53 tok)

## backend/src/main/java/com/terra/backend/repository/

- `AiSettingsRepository.java` — Repository: AiSettingsRepository (~83 tok)
- `AiSuggestionLogRepository.java` — Class: AiSuggestionLogRepository (~125 tok)
- `CommentRepository.java` — Class: CommentRepository (~127 tok)
- `NotificationRepository.java` — Class: NotificationRepository (~305 tok)
- `PendingActionRepository.java` — Class: PendingActionRepository (~102 tok)
- `ProjectRepository.java` — Class: ProjectRepository (~223 tok)
- `TaskRepository.java` — Class: TaskRepository (~129 tok)
- `TeamRepository.java` — Class: TeamRepository (~74 tok)
- `UserRepository.java` — Class: UserRepository (~97 tok)

## backend/src/main/java/com/terra/backend/security/

- `AuthEntryPointJwt.java` — Component: AuthEntryPointJwt (~384 tok)
- `CustomUserDetailsService.java` — Service: CustomUserDetailsService (~391 tok)
- `JwtAccessDeniedHandler.java` — Component: JwtAccessDeniedHandler (~385 tok)
- `JwtAuthenticationFilter.java` — Class: JwtAuthenticationFilter (~653 tok)
- `JwtTokenProvider.java` — Component: JwtTokenProvider (~799 tok)
- `SecurityConfig.java` — ").permitAll() (~1366 tok)

## backend/src/main/java/com/terra/backend/service/

- `AiCommandService.java` — Service: AiCommandService (~7705 tok)
- `AiInsightsEngine.java` — Service: AiInsightsEngine (~790 tok)
- `AiSettingsService.java` — Resolved model/endpoint/key for the LLM client, read from the DB so an admin (~1528 tok)
- `AuthenticationService.java` — Service: AuthenticationService (~1197 tok)
- `AuthorizationService.java` — Service: AuthorizationService (~750 tok)
- `CommentService.java` — Service: CommentService (~1461 tok)
- `ContextCompressor.java` — Service: ContextCompressor (~307 tok)
- `EmailService.java` — Stub email service. Logs tokens instead of sending real emails. (~204 tok)
- `NotificationService.java` — Service: NotificationService (~1075 tok)
- `ProjectService.java` — Service: ProjectService (~1414 tok)
- `RedisStateService.java` — Service: RedisStateService (~1105 tok)
- `TaskService.java` — Service: TaskService (~2440 tok)
- `TeamService.java` — Service: TeamService (~774 tok)
- `TokenService.java` — Service: TokenService (~279 tok)
- `UserAdminService.java` — Service: UserAdminService (~987 tok)
- `UserService.java` — Service: UserService (~251 tok)
- `WebSocketService.java` — Service: WebSocketService (~600 tok)

## backend/src/main/resources/

- `application.properties` — DB config, JWT, WebSocket, Swagger, logging, CORS, Redis, rate-limit props. AI model/provider are NOT here anymore (moved to `ai_settings` DB table) — only `ai.openai.api.url` (fallback URL for unmapped providers) and `ai.openai.timeout`/`ai.encryption.key` remain (~474 tok)

## backend/src/test/java/com/terra/backend/controller/

- `ProjectControllerTest.java` — ProjectControllerTest: setup, shouldReturnAllProjects, shouldReturnProjectById (~680 tok)

## frontend/

- `.dockerignore` — Docker ignore rules (~19 tok)
- `.gitignore` — Git ignore rules (~90 tok)
- `.prettierignore` (~25 tok)
- `.prettierrc` — Prettier configuration (~24 tok)
- `bun.lockb` — Bun lock file (~85971 tok)
- `bunfig.toml` (~80 tok)
- `components.json` (~127 tok)
- `docker-entrypoint.sh` (~180 tok)
- `Dockerfile` — Docker container definition (~33 tok)
- `eslint.config.js` — ESLint flat configuration (~358 tok)
- `package.json` — Node.js package manifest (~952 tok)
- `playwright.config.ts` — Playwright test configuration (~140 tok)
- `tsconfig.json` — TypeScript configuration (~192 tok)
- `ui_api_test_report.md` — UI and API Automated Testing Report (~52 tok)
- `vite.config.ts` — Vite build configuration (~333 tok)
- `vitest.config.ts` — Vitest test configuration (~103 tok)
- `wrangler.jsonc` (~54 tok)

## frontend/.tanstack/tmp/

- `a8c67b8b-46adbb747b8d1578f85537453d70ca74` — Exports Route (~7406 tok)
- `b8354dae-5ea15d924facd5b5270e8ac2d0ed47ec` — @ts-nocheck (~4476 tok)

## frontend/.wrangler/deploy/

- `config.json` (~20 tok)

## frontend/e2e/

- `smoke.spec.ts` — Declares managerPersona (~175 tok)

## frontend/e2e/schemas/

- `apiSchemas.ts` — Auth Schemas (~430 tok)

## frontend/e2e/tests/

- `auth.spec.ts` — Declares apiValidator (~292 tok)
- `chatBubble.spec.ts` — Declares apiValidator (~618 tok)

## frontend/e2e/utils/

- `apiValidator.ts` — Exports ApiValidator (~798 tok)
- `markdownReporter.ts` — Exports ApiValidationError, apiErrors (~584 tok)

## frontend/playwright-report/

- `index.html` — Playwright Test Report (~238821 tok)

## frontend/playwright-report/data/

- `09117b5c3d4a7b19cb283114ec3b1ced23c577d0.md` — Instructions (~464 tok)

## frontend/src/

- `router.tsx` — getRouter (~113 tok)
- `routeTree.gen.ts` — @ts-nocheck (~4799 tok)
- `server.ts` — API routes: GET (1 endpoints) (~711 tok)
- `start.ts` — Exports startInstance (~177 tok)
- `styles.css` — Styles: 7 rules, 72 vars, 2 layers (~1273 tok)

## frontend/src/components/

- `app-shell.tsx` — Header search term for the currently viewed page. Filters that page's primary list. (~4428 tok)
- `chat-bubble.tsx` — WELCOME_MSG — renders form — uses useState, useEffect (~3768 tok)
- `client-only.tsx` — ClientOnly — uses useState, useEffect (~73 tok)
- `create-task-dialog.tsx` — components/CreateTaskDialog.tsx (~1074 tok)

## frontend/src/components/ui/

- `accordion.tsx` — Accordion (~576 tok)
- `alert-dialog.tsx` — AlertDialog (~1196 tok)
- `alert.tsx` — alertVariants (~454 tok)
- `aspect-ratio.tsx` — AspectRatio (~41 tok)
- `avatar.tsx` — Avatar (~404 tok)
- `badge.test.tsx` (~206 tok)
- `badge.tsx` — badgeVariants (~321 tok)
- `breadcrumb.tsx` — Breadcrumb (~786 tok)
- `button.tsx` — buttonVariants (~542 tok)
- `calendar.tsx` — Calendar — uses useEffect (~2060 tok)
- `card.tsx` — Card (~520 tok)
- `carousel.tsx` — CarouselContext — uses useContext, useState, useCallback, useEffect (~1772 tok)
- `chart.tsx` — Format: { THEME_NAME: CSS_SELECTOR } (~3020 tok)
- `checkbox.tsx` — Checkbox (~298 tok)
- `collapsible.tsx` — Collapsible (~96 tok)
- `command.tsx` — Command — renders modal (~1394 tok)
- `context-menu.tsx` — ContextMenu (~2112 tok)
- `dialog.tsx` — Dialog — renders modal (~1043 tok)
- `drawer.tsx` — Drawer — renders modal (~850 tok)
- `dropdown-menu.tsx` — DropdownMenu (~2171 tok)
- `form.tsx` — Form — renders form — uses useContext (~1201 tok)
- `hover-card.tsx` — HoverCard (~356 tok)
- `input-otp.tsx` — InputOTP — uses useContext (~618 tok)
- `input.tsx` — Input (~222 tok)
- `label.tsx` — labelVariants (~205 tok)
- `menubar.tsx` — MenubarMenu (~2442 tok)
- `navigation-menu.tsx` — NavigationMenu (~1472 tok)
- `pagination.tsx` — Pagination (~783 tok)
- `popover.tsx` — Popover (~387 tok)
- `progress.tsx` — Progress (~224 tok)
- `radio-group.tsx` — RadioGroup (~402 tok)
- `resizable.tsx` — ResizablePanelGroup (~444 tok)
- `scroll-area.tsx` — ScrollArea (~468 tok)
- `select.tsx` — Select (~1643 tok)
- `separator.tsx` — Separator (~207 tok)
- `sheet.tsx` — Sheet (~1214 tok)
- `sidebar.tsx` — SIDEBAR_COOKIE_NAME — uses useContext, useState, useCallback, useEffect (~6850 tok)
- `skeleton.tsx` — Skeleton (~69 tok)
- `slider.tsx` — Slider (~293 tok)
- `sonner.tsx` — Toaster (~210 tok)
- `switch.tsx` — Switch (~331 tok)
- `table.tsx` — Table — renders table (~806 tok)
- `tabs.tsx` — Tabs (~553 tok)
- `textarea.tsx` — Textarea (~194 tok)
- `toggle-group.tsx` — ToggleGroupContext — uses useContext (~501 tok)
- `toggle.tsx` — toggleVariants (~439 tok)
- `tooltip.tsx` — TooltipProvider (~366 tok)

## frontend/src/hooks/

- `use-mobile.tsx` — MOBILE_BREAKPOINT — uses useEffect (~165 tok)

## frontend/src/lib/

- `api.ts` — Exports getAuthToken, setAuthToken, removeAuthToken, apiFetch + 58 more (~4330 tok)
- `auth.tsx` — AuthContext — uses useState, useEffect, useContext (~690 tok)
- `error-capture.ts` — Captures the original Error out-of-band so server.ts can recover the stack (~259 tok)
- `error-page.ts` — Exports renderErrorPage (~392 tok)
- `route-guards.ts` — Exports AppRole, requireAuth, requireRole, requireGuest (~446 tok)
- `use-websocket.ts` — ---------- global module state (singleton) ---------- (~711 tok)
- `utils.test.ts` — Declares names (~135 tok)
- `utils.ts` — Exports cn (~49 tok)
- `websocket.ts` — WebSocket client — SockJS + STOMP. Comment-topic subs now use a `commentSubs` registry re-created in `onConnect` (mirrors notification sub) so they survive reconnects, not just initial connect (~2500 tok)

## frontend/src/lib/validations/

- `auth.ts` — Zod schemas: loginSchema, verifyEmailSchema, forgotPasswordSchema (~515 tok)
- `project.ts` — Zod schemas: ProjectPriority, ProjectStatus, createProjectSchema, createTeamSchema (~446 tok)
- `task.ts` — Zod schemas: TaskStatus, TaskPriority, createTaskSchema (~326 tok)

## frontend/src/routes/

- `__root.tsx` — NotFoundComponent (~1515 tok)
- `forgot-password.tsx` — Route — renders form — uses useState (~1393 tok)
- `index.tsx` — Route (~728 tok)
- `login.tsx` — Route — renders form — uses useNavigate (~1580 tok)
- `reset-password.tsx` — Route — renders form — uses useNavigate, useState (~2030 tok)
- `verify.tsx` — Route — renders form — uses useState (~1554 tok)

## frontend/src/routes/admin/

- `ai-settings.tsx` — Known providers: prefilled model + API URL on selection (still freely editable after). (~4246 tok)
- `system-stats.tsx` — Route — uses useQuery (~1299 tok)
- `teams.tsx` — Route — renders modal — uses useState, useQuery, useMutation (~3169 tok)
- `users.tsx` — Route — renders table, modal — uses useState, useQuery, useMemo, useMutation (~4976 tok)

## frontend/src/routes/manager/

- `analytics.tsx` — Route — uses useQuery (~1147 tok)
- `create-project.tsx` — Route — uses useState, useQuery, useMutation (~1475 tok)
- `dashboard.tsx` — Route (~1955 tok)
- `kanban.tsx` — Route — renders modal (~5455 tok)
- `projects.$projectId.tsx` — Route — renders modal — uses useState, useQuery, useMutation (~7938 tok)
- `tasks.$taskId.tsx` — Route. taskComments useQuery now tracks isError (retry:false) and renders an Arabic access-error message instead of silently showing empty state (~5241 tok)

## frontend/src/routes/manager/__tests__/

- `-dashboard.test.tsx` — Mocking AppShell since it uses useRouterState which requires a router context (~556 tok)

## frontend/src/routes/member/

- `kanban.tsx` — Route — renders modal (~4905 tok)
- `my-tasks.tsx` — Route (~1334 tok)
- `projects.tsx` — Route — renders modal (~8020 tok)
- `tasks.$taskId.tsx` — Route. beforeLoad now requireRole("/member") (was "/manager", unreachable — bug-014) and AppShell persona="member" (was "manager" — bug-011). Real-time comment WS effect (bug-004 pattern) unchanged, page is now actually reachable for members (~5240 tok)

## frontend/src/routes/user/

- `profile.tsx` — Route (~1105 tok)

## frontend/src/test/

- `setup.ts` — Start MSW server before all tests (~121 tok)
- `utils.tsx` — renderWithProviders (~131 tok)

## frontend/test-results/

- `.last-run.json` (~26 tok)

## frontend/test-results/tests-auth-Authentication-Flow-User-can-login-successfully-chromium/

- `error-context.md` — Instructions (~464 tok)
