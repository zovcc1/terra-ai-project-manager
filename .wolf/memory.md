# Memory

> Chronological action log. Hooks and AI append to this file automatically.
> Old sessions are consolidated by the daemon weekly.

## Session: 2026-06-24 14:55

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-06-24 14:55

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 14:58 | Created ../../../.claude/plans/make-readme-md-for-the-steady-glade.md | — | ~1594 |
| 14:59 | Created README.md | — | ~2186 |

| 14:59 | Created README.md with full project overview (stack, roles, setup, AI pipeline, Docker/local dev instructions) | README.md | done | ~1200 |
| 15:00 | Session end: 2 writes across 2 files (make-readme-md-for-the-steady-glade.md, README.md) | 7 reads | ~6834 tok |

## Session: 2026-07-04 16:27

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 16:43 | Created ../../../.claude/plans/we-need-to-fix-rippling-toucan.md | — | ~1941 |
| 16:44 | Edited ../../../.claude/plans/we-need-to-fix-rippling-toucan.md | modified scope() | ~254 |

## Session: 2026-07-04 16:45

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-04 16:45

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-04 16:47

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 16:48 | Fixed subscribeNotifications() race so STOMP SUBSCRIBE to /user/queue/notifications is actually sent — root cause of mentions never arriving live | frontend/src/lib/websocket.ts | fixed, tsc clean | ~345 |
| 16:49 | Hardened comment-subscription useEffect: hoisted unsubscribe out of .then(), removed wsInitialized ref, real cleanup now unsubscribes | frontend/src/routes/member/tasks.$taskId.tsx | fixed, tsc clean | ~275 |
| 16:50 | Same comment-subscription hardening as member route | frontend/src/routes/manager/tasks.$taskId.tsx | fixed, tsc clean | ~275 |
| 16:51 | Added Page<T> type; getRecentNotifications now takes (page, size) and sends them as query params (was silently dropping page, breaking pagination) | frontend/src/lib/api.ts | fixed, tsc clean (21→15 pre-existing errors, no new ones) | ~96 |
| 16:52 | Session end: implemented all 3 items from plan we-need-to-fix-rippling-toucan.md; logged bug-003/004/005 to buglog.json; updated cerebrum.md Key Learnings + Do-Not-Repeat | websocket.ts, tasks.$taskId.tsx (x2), api.ts | plan complete, manual browser verification still pending | ~2500 |
| 17:01 | Session end: 4 writes across 3 files (websocket.ts, tasks.$taskId.tsx, api.ts) | 3 reads | ~15668 tok |

## Session: 2026-07-04 17:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:03 | Verified bug-004 fix (WS comment subscription) actually works live: manager posts comment, appears instantly via WS with no manual refetch | — | confirmed working, no code change | ~300 |
| 21:05 | Diagnosed NEW bug: AccessDeniedException from @PreAuthorize on comments endpoints was swallowed by catch-all RuntimeException->500 handler; compounded by TaskController.getTaskById using a loose role-only check (no task/project scoping) and frontend silently showing "no comments" on any fetch error | GlobalExceptionHandler.java, TaskController.java, CommentController.java, AuthorizationService.java | root-caused via live repro with member@terra.com on task 17 (project team has 0 team_members rows) | ~1800 |
| 21:10 | Added @ExceptionHandler(AccessDeniedException.class) -> 403 | GlobalExceptionHandler.java | fixed, mvn -o compile clean | ~120 |
| 21:11 | Reconciled getTaskById's @PreAuthorize to @authorizationService.hasTaskAccess(#principal.username, #id), matching moveTask/CommentController pattern | TaskController.java | fixed, mvn -o compile clean | ~90 |
| 21:13 | Added isError (retry:false) to taskComments useQuery; render Arabic access-error message instead of silent empty state | tasks.$taskId.tsx (member + manager) | fixed, tsc clean (no new errors) | ~200 |
| 21:20 | Restarted backend (mvn spring-boot:run, env from project .env) to pick up compiled fixes; verified live: member@terra.com now gets 403 (was 500) on GET /api/member/tasks/17 and /comments; manager@terra.com (real access) unaffected, comments still load and new comment still arrives in real time via WS | — | all 3 approved fixes verified end-to-end in browser | ~600 |
| 21:22 | Session end: 4 writes across 4 files; updated anatomy.md, cerebrum.md, buglog.json | GlobalExceptionHandler.java, TaskController.java, tasks.$taskId.tsx x2 | plan complete, live-verified | ~4500 |

## Session: 2026-07-04 20:41

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 20:42 | Edited backend/src/main/java/com/terra/backend/controller/TaskController.java | modified getTaskById() | ~125 |
| 20:42 | Edited backend/src/main/java/com/terra/backend/exception/GlobalExceptionHandler.java | added 1 import(s) | ~59 |
| 20:43 | Edited backend/src/main/java/com/terra/backend/exception/GlobalExceptionHandler.java | modified handleUnauthorized() | ~223 |
| 20:44 | Edited frontend/src/routes/member/tasks.$taskId.tsx | CSS: isError, retry | ~55 |
| 20:44 | Edited frontend/src/routes/member/tasks.$taskId.tsx | 3→7 lines | ~126 |
| 20:45 | Edited frontend/src/routes/manager/tasks.$taskId.tsx | CSS: isError, retry | ~55 |
| 21:00 | Edited frontend/src/routes/manager/tasks.$taskId.tsx | 3→7 lines | ~126 |
| 21:04 | Created ../../../../../tmp/claude-1000/-home-kasem-Documents-freelance-ai-project-manager/0d6c237f-9b34-4416-afe9-3795ce580951/scratchpad/relaunch_backend.sh | — | ~117 |
| 21:18 | Session end: 8 writes across 4 files (TaskController.java, GlobalExceptionHandler.java, tasks.$taskId.tsx, relaunch_backend.sh) | 4 reads | ~13673 tok |

## Session: 2026-07-04 21:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 21:37 | Created ../../../.claude/plans/the-comment-issue-inside-lexical-dragon.md | — | ~1486 |
| 21:38 | Edited frontend/src/lib/websocket.ts | added error handling | ~269 |
| 21:38 | Edited frontend/src/lib/websocket.ts | expanded (+6 lines) | ~79 |
| 21:38 | Edited frontend/src/lib/websocket.ts | 4→5 lines | ~29 |
| 21:38 | Edited frontend/src/lib/websocket.ts | modified subscribeTaskComments() | ~134 |
| 21:49 | Session end: 5 writes across 2 files (the-comment-issue-inside-lexical-dragon.md, websocket.ts) | 6 reads | ~16713 tok |

## Session: 2026-07-04 22:11

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 22:29 | Live-verified bug-010 fix partially: manager REST-posted plain (non-mention) comments to task 15 both before and after a full backend restart (forced reconnect), both succeeded server-side (comment ids 28607, 28608) | — | backend side confirmed working; browser-side live-delivery-without-refresh confirmation was cut short by user before completion | ~400 |
| 22:30 | Discovered two-tab-same-origin localStorage collision invalidates the original two-browser-tab test methodology (manager+member tabs share terra_token/terra_user); switched to single member tab + curl-driven manager actions | — | methodology fix, logged to cerebrum Do-Not-Repeat | ~300 |
| 22:31 | Discovered separate unrelated bug: member/tasks.$taskId.tsx hardcodes AppShell persona="manager" at all 3 call sites | frontend/src/routes/member/tasks.$taskId.tsx | logged as bug-011, NOT fixed (out of scope, user asked to stop and write bookkeeping instead) | ~150 |
| 22:32 | Updated anatomy.md (websocket.ts + member tasks.$taskId.tsx entries), buglog.json (bug-010, bug-011), cerebrum.md (Key Learnings + Do-Not-Repeat) for this session's WS-reconnect fix and live-test findings | anatomy.md, buglog.json, cerebrum.md | done | ~1800 |

## Session: 2026-07-05 18:10

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-05 02:14

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 03:20 | Created ../../../.claude/plans/check-all-websocket-problems-enchanted-matsumoto.md | — | ~1693 |
| 03:21 | Edited backend/src/main/java/com/terra/backend/service/AiSettingsService.java | added 2 condition(s) | ~499 |
| 03:22 | Edited backend/src/main/java/com/terra/backend/service/AiSettingsService.java | removed 11 lines | ~12 |
| 03:22 | Edited backend/src/main/java/com/terra/backend/ai/OpenAiClient.java | modified OpenAiClient() | ~461 |
| 03:22 | Edited backend/src/main/resources/application.properties | 4→5 lines | ~74 |
| 03:24 | Ran `./mvnw -o compile` to verify backend builds after moving AI model/provider config from application.properties to ai_settings DB table | backend (mvn) | BUILD SUCCESS | ~200 |
| 03:25 | Updated anatomy.md (OpenAiClient.java, AiSettingsService.java, application.properties descriptions) and cerebrum.md (Decision Log + Key Learnings) for this session's DB-driven AI config change | anatomy.md, cerebrum.md | done | ~600 |
| 03:32 | Session end: 5 writes across 4 files (check-all-websocket-problems-enchanted-matsumoto.md, AiSettingsService.java, OpenAiClient.java, application.properties) | 10 reads | ~11176 tok |

## Session: 2026-07-06 03:34

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 01:10 | Diagnosed why member comments aren't real-time (manager is): member tasks.$taskId route unreachable (requireRole("/manager") copy-paste) + member kanban/projects comment modals have no WS subscription; logged bug-014, diagnosis only, no fix applied | member/tasks.$taskId.tsx, member/kanban.tsx, member/projects.tsx, websocket.ts, route-guards.ts, WebSocketService.java | diagnosed | ~14k |
| 03:52 | Created ../../../.claude/plans/suggest-the-fix-for-delightful-anchor.md | — | ~1929 |
| 03:54 | Edited frontend/src/routes/member/kanban.tsx | 4→4 lines | ~91 |
| 03:54 | Edited frontend/src/routes/member/kanban.tsx | added optional chaining | ~378 |
| 03:54 | Edited frontend/src/routes/member/projects.tsx | inline fix | ~17 |
| 03:54 | Edited frontend/src/routes/member/projects.tsx | added 2 import(s) | ~76 |
| 03:54 | Edited frontend/src/routes/member/projects.tsx | added optional chaining | ~378 |
| 03:55 | Edited frontend/src/routes/member/tasks.$taskId.tsx | "/manager" → "/member" | ~13 |
| 03:55 | Edited frontend/src/routes/member/tasks.$taskId.tsx | "manager" → "member" | ~5 |
| 01:35 | Implemented real-time comment fix (bug-014) + role-guard/persona fix (bug-011): added wsConnect+subscribeTaskComments effect to member kanban/projects TaskDetailDialog; fixed requireRole("/manager")->"/member" and persona="manager"->"member" in member tasks.$taskId.tsx | member/kanban.tsx, member/projects.tsx, member/tasks.$taskId.tsx | verified via tsc --noEmit + eslint (no new errors vs pre-edit baseline) | ~30k |
| 03:58 | Session end: 8 writes across 4 files (suggest-the-fix-for-delightful-anchor.md, kanban.tsx, projects.tsx, tasks.$taskId.tsx) | 9 reads | ~30927 tok |

## Session: 2026-07-06 04:01

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 04:04 | Created ../../../.claude/plans/push-docker-backend-to-wild-hickey.md | — | ~642 |
| 04:07 | Session end: 1 writes across 1 files (push-docker-backend-to-wild-hickey.md) | 5 reads | ~1303 tok |

## Session: 2026-07-09 07:45

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 07:54 | Created ../../../.claude/plans/plan-to-add-deepseek-warm-wren.md | — | ~1749 |
| 07:56 | Edited backend/src/main/java/com/terra/backend/entity/AiSettings.java | 9→12 lines | ~68 |
| 07:56 | Edited backend/src/main/java/com/terra/backend/dto/request/AiSettingsRequest.java | 5→6 lines | ~46 |
| 07:56 | Edited backend/src/main/java/com/terra/backend/dto/response/AiSettingsResponse.java | 5→6 lines | ~47 |
| 07:57 | Edited backend/src/main/java/com/terra/backend/service/AiSettingsService.java | modified resolveApiUrl() | ~203 |
| 07:57 | Edited backend/src/main/java/com/terra/backend/service/AiSettingsService.java | 7→8 lines | ~106 |
| 07:57 | Edited backend/src/main/java/com/terra/backend/service/AiSettingsService.java | added 1 condition(s) | ~81 |
| 07:57 | Edited frontend/src/lib/api.ts | 7→8 lines | ~44 |
| 07:57 | Edited frontend/src/routes/admin/ai-settings.tsx | expanded (+24 lines) | ~268 |
| 07:58 | Edited frontend/src/routes/admin/ai-settings.tsx | expanded (+17 lines) | ~719 |
| 07:58 | Edited frontend/src/routes/admin/ai-settings.tsx | CSS: deepseek, custom | ~66 |
| 07:58 | Edited frontend/src/routes/admin/ai-settings.tsx | expanded (+6 lines) | ~217 |
| 07:59 | Edited frontend/src/components/app-shell.tsx | inline fix | ~26 |
| 07:59 | Edited frontend/src/components/app-shell.tsx | modified useHeaderSearch() | ~333 |
| 07:59 | Edited frontend/src/components/app-shell.tsx | 2→7 lines | ~102 |
| 08:00 | Edited frontend/src/components/app-shell.tsx | CSS: query, setQuery | ~60 |
| 08:00 | Edited frontend/src/routes/manager/dashboard.tsx | inline fix | ~23 |
| 08:00 | Edited frontend/src/routes/manager/dashboard.tsx | added optional chaining | ~67 |
| 08:01 | Edited frontend/src/routes/manager/dashboard.tsx | inline fix | ~12 |
| 08:01 | Edited frontend/src/routes/manager/kanban.tsx | inline fix | ~23 |
| 08:02 | Edited frontend/src/routes/manager/kanban.tsx | 1→3 lines | ~55 |
| 08:02 | Edited frontend/src/routes/manager/kanban.tsx | 4→6 lines | ~52 |
| 08:03 | Edited frontend/src/routes/member/kanban.tsx | inline fix | ~23 |
| 08:03 | Edited frontend/src/routes/member/kanban.tsx | 6→8 lines | ~57 |
| 08:03 | Edited frontend/src/routes/member/kanban.tsx | 1→3 lines | ~55 |
| 08:03 | Edited frontend/src/routes/member/my-tasks.tsx | inline fix | ~23 |
| 08:04 | Edited frontend/src/routes/member/my-tasks.tsx | added optional chaining | ~75 |
| 08:04 | Edited frontend/src/routes/member/my-tasks.tsx | added optional chaining | ~112 |
| 08:05 | Edited frontend/src/routes/member/projects.tsx | inline fix | ~23 |
| 08:05 | Edited frontend/src/routes/member/projects.tsx | 1→6 lines | ~61 |
| 08:09 | Edited frontend/src/components/app-shell.tsx | modified useHeaderSearch() | ~160 |
| 08:09 | Edited frontend/src/components/app-shell.tsx | setSearchQuery() → useContext() | ~61 |
| 08:09 | Edited frontend/src/components/app-shell.tsx | 5→1 lines | ~17 |
| 08:10 | Edited frontend/src/routes/__root.tsx | added 2 import(s) | ~133 |
| 08:10 | Edited frontend/src/routes/__root.tsx | CSS: select, query, setQuery | ~303 |
| 08:14 | Added DeepSeek + custom API URL to AI settings (provider preset map, always-editable URL field, backend apiUrl column/DTO/service) | AiSettings.java, AiSettingsRequest.java, AiSettingsResponse.java, AiSettingsService.java, admin/ai-settings.tsx, lib/api.ts | done, backend compiles, tsc clean | ~9000 |
| 08:14 | Wired header search to filter each page's primary list; state moved to __root.tsx (AppContent) since AppShell is rendered *by* pages, not the reverse — a Provider inside AppShell can't be read by its own caller | app-shell.tsx, __root.tsx, manager/dashboard.tsx, manager/kanban.tsx, member/kanban.tsx, member/my-tasks.tsx, member/projects.tsx | done, tsc clean (pre-existing unrelated errors only) | ~7000 |
| 08:18 | Session end: 35 writes across 13 files (plan-to-add-deepseek-warm-wren.md, AiSettings.java, AiSettingsRequest.java, AiSettingsResponse.java, AiSettingsService.java) | 10 reads | ~24082 tok |

## Session: 2026-07-09 08:37

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-09 09:37

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-09 13:26

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|

## Session: 2026-07-09 13:27

| Time | Action | File(s) | Outcome | ~Tokens |
|------|--------|---------|---------|--------|
| 13:30 | Created ../../../.claude/plans/push-changes-to-docker-transient-ullman.md | — | ~745 |
| 13:31 | Session end: 1 writes across 1 files (push-changes-to-docker-transient-ullman.md) | 3 reads | ~1252 tok |
| 13:37 | Session end: 1 writes across 1 files (push-changes-to-docker-transient-ullman.md) | 3 reads | ~1252 tok |
| 13:41 | Session end: 1 writes across 1 files (push-changes-to-docker-transient-ullman.md) | 3 reads | ~1252 tok |
