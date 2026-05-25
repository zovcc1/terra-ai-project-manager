# API & Client Communication Guide
# دليل الاتصال بين الـ API واجهة المستخدم

---

## System Architecture Overview / نظرة عامة على بنية النظام

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WEB BROWSER / المتصفح                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              Frontend App (React + TanStack Start)                │  │
│  │              الواجهة الأمامية (React + TanStack Start)           │  │
│  │                                                                   │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │  │
│  │   │ Login Page  │  │  Dashboard  │  │    Kanban Board         │  │  │
│  │   │ صفحة الدخول  │  │   لوحة التحكم│  │    لوحة المهام         │  │  │
│  │   └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │  │
│  │          │                │                       │               │  │
│  │   ┌──────┴────────────────┴───────────────────────┴──────────┐   │  │
│  │   │              API Client Layer (api.ts)                    │   │  │
│  │   │           طبقة الاتصال بالـ API (api.ts)                 │   │  │
│  │   │                                                           │   │  │
│  │   │  • Stores JWT token in localStorage                       │   │  │
│  │   │  • يحفظ رمز JWT في localStorage                            │   │  │
│  │   │  • Adds Authorization: Bearer <token> to every request    │   │  │
│  │   │  • يضيف ترخيص: Bearer <token> لكل طلب                    │   │  │
│  │   └───────────────────────────┬───────────────────────────────┘   │  │
│  └───────────────────────────────┼───────────────────────────────────┘  │
│                                  │                                      │
│              HTTP Requests / طلبات HTTP                                 │
│         (JSON over REST + WebSocket / JSON عبر REST + WebSocket)       │
│                          │                │                             │
│                          │                │                             │
├──────────────────────────┼────────────────┼─────────────────────────────┤
│                          ▼                ▼                             │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │             Backend API (Spring Boot 3.2.5)                       │  │
│  │             الخلفية البرمجية (Spring Boot)                        │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │              Security Layer / طبقة الأمان                   │  │  │
│  │  │                                                             │  │  │
│  │  │  • JWT Token Validation / التحقق من رمز JWT                │  │  │
│  │  │  • BCrypt Password Encoding / تشفير كلمات المرور           │  │  │
│  │  │  • Role-Based Access (ADMIN/MANAGER/MEMBER)                 │  │  │
│  │  │  • الوصول المستند للدور (مدير/مسؤول/عضو)                   │  │  │
│  │  │  • CORS Configuration / إعدادات CORS                       │  │  │
│  │  └─────────────────────────┬───────────────────────────────────┘  │  │
│  │                            │                                      │  │
│  │  ┌─────────────────────────┴───────────────────────────────────┐  │  │
│  │  │           REST Controllers / المتحكمات                      │  │  │
│  │  │                                                             │  │  │
│  │  │  /api/auth/*    ←→ AuthController    (Authentication)       │  │  │
│  │  │  /api/manager/* ←→ ProjectController (Project Management)   │  │  │
│  │  │  /api/member/*  ←→ TaskController    (Task Management)      │  │  │
│  │  │  /api/ai/*      ←→ AiCommandController(AI Commands)        │  │  │
│  │  │  /ws            ←→ WebSocketConfig  (Real-time Updates)    │  │  │
│  │  └─────────────────────────┬───────────────────────────────────┘  │  │
│  │                            │                                      │  │
│  │  ┌─────────────────────────┴───────────────────────────────────┐  │  │
│  │  │            Services Layer / طبقة الخدمات                    │  │  │
│  │  │                                                             │  │  │
│  │  │  AuthService          ProjectService       TaskService      │  │  │
│  │  │  AiProjectManagerService  AuthorizationService              │  │  │
│  │  └─────────────────────────┬───────────────────────────────────┘  │  │
│  │                            │                                      │  │
│  │  ┌────────────┐   ┌───────┴───────┐                              │  │
│  │  │  MariaDB   │   │    Redis      │                              │  │  │
│  │  │  (Data)    │   │ (Sessions)    │                              │  │  │
│  │  │  (البيانات)│   │  (الجلسات)    │                              │  │
│  │  └────────────┘   └───────────────┘                              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow / تدفق المصادقة

```
┌──────────────┐                          ┌──────────────────┐
│   User /     │                          │   Backend /      │
│   المستخدم  │                          │   الخلفية        │
└──────┬───────┘                          └────────┬─────────┘
       │                                           │
       │  POST /api/auth/login                     │
       │  { email, password }                      │
       │  البريد الإلكتروني، كلمة المرور          │
       │ ─────────────────────────────────────────>│
       │                                           │
       │                              1. via AuthenticationManager
       │                                 بواسطة AuthenticationManager
       │                              2. BCrypt password check
       │                                 التحقق باستخدام BCrypt
       │                              3. Generate JWT access token
       │                                 إنشاء رمز JWT
       │                              4. Store refresh token in Redis
       │                                 حفظ رمز التحديث في Redis
       │                                           │
       │  200 OK                                   │
       │  { accessToken, refreshToken,             │
       │    user: { id, email, roles } }           │
       │  رمز الوصول، رمز التحديث، بيانات المستخدم│
       │ <─────────────────────────────────────────│
       │                                           │
       │  Store token in localStorage              │
       │  حفظ الرمز في localStorage                │
       │                                           │
       │  ┌─────────────────────────────────────┐  │
       │  │  Future Requests / الطلبات المستقبلية│  │
       │  │                                     │  │
       │  │  Header: Authorization: Bearer      │  │
       │  │           <accessToken>             │  │
       │  └─────────────────────────────────────┘  │
       │                                           │
```

---

## All API Endpoints / جميع نقاط الاتصال (Endpoints)

### 1. Authentication / المصادقة

| Method | Endpoint | Description / الوصف | Auth Required / مصادقة | Role / الدور |
|--------|----------|---------------------|----------------------|--------------|
| `POST` | `/api/auth/login` | Login with email/username + password | No / لا | Public / عام |

---

### 2. Project Management / إدارة المشاريع

| Method | Endpoint | Description / الوصف | Auth Required / مصادقة | Role / الدور |
|--------|----------|---------------------|----------------------|--------------|
| `GET` | `/api/manager/projects` | Get all projects / جلب جميع المشاريع | Yes / نعم | ADMIN |
| `GET` | `/api/manager/projects/{id}` | Get one project / جلب مشروع واحد | Yes / نعم | ADMIN / MANAGER / MEMBER |

---

### 3. Task Management / إدارة المهام

| Method | Endpoint | Description / الوصف | Auth Required / مصادقة | Role / الدور |
|--------|----------|---------------------|----------------------|--------------|
| `GET` | `/api/member/tasks/project/{projectId}` | Get tasks in a project / جلب مهام المشروع | Yes / نعم | Project Member / عضو المشروع |
| `PATCH` | `/api/member/tasks/{id}/status?status={status}` | Update task status / تحديث حالة المهمة | Yes / نعم | Project Member / عضو المشروع |
| `PATCH` | `/api/member/tasks/{id}/move?status={status}&orderIndex={index}` | Move task to column / نقل المهمة لعمود | Yes / نعم | Project Member / عضو المشروع |

Status values / قيم الحالة: `TODO` | `DOING` | `REVIEW` | `DONE`

---

### 4. AI Commands / أوامر الذكاء الاصطناعي

| Method | Endpoint | Description / الوصف | Auth Required / مصادقة | Role / الدور |
|--------|----------|---------------------|----------------------|--------------|
| `POST` | `/api/ai/command` | Send AI command / إرسال أمر للذكاء الاصطناعي | Yes / نعم | Any / أي مستخدم |
| `GET` | `/api/ai/pending-actions` | List pending actions / قائمة الإعلانات المعلقة | Yes / نعم | Action Owner / مالك الإجراء |
| `POST` | `/api/ai/confirm/{actionId}` | Approve/Deny action / الموافقة/رفض إجراء | Yes / نعم | Action Owner / مالك الإجراء |
| `DELETE` | `/api/ai/pending-actions/{actionId}` | Dismiss pending action / تجاهل إجراء معلق | Yes / نعم | Action Owner / مالك الإجراء |

---

### 5. Real-Time WebSocket / الاتصال الفوري (WebSocket)

| Endpoint | Description / الوصف | Auth Required / مصادقة |
|----------|---------------------|----------------------|
| `/ws` | WebSocket connection point / نقطة اتصال WebSocket | JWT in header / JWT في الترويسة |
| `/app/**` | Client sends here / يرسل العميل هنا | Yes / نعم |
| `/topic/kanban/{projectId}` | Kanban updates / تحديثات لوحة المهام | Yes / نعم |
| `/user/queue/**` | Private messages / رسائل خاصة | Yes / نعم |

---

### 6. Public / Health Endpoints / نقاط الاتصال العامة

| Method | Endpoint | Description / الوصف | Auth Required / مصادقة |
|--------|----------|---------------------|----------------------|
| `GET` | `/api/health` | Health check / فحص الصحة | No / لا |
| `GET` | `/api/test/**` | Test endpoints / نقاط اختبار | No / لا |
| `GET` | `/swagger-ui.html` | API documentation / توثيق الـ API | No / لا |

---

## Request & Response Examples / أمثلة الطلبات والاستجابات

### Login / تسجيل الدخول

```
Request / الطلب:
  POST /api/auth/login
  Content-Type: application/json

  {
    "email": "admin@example.com",
    "password": "password"
  }

Response / الاستجابة:
  200 OK
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "type": "Bearer",
    "id": 1,
    "email": "admin@example.com",
    "roles": ["ROLE_ADMIN"]
  }
```

### Get Projects / جلب المشاريع

```
Request / الطلب:
  GET /api/manager/projects
  Authorization: Bearer <token>

Response / الاستجابة:
  200 OK
  [
    {
      "id": 1,
      "name": "Project Alpha",
      "description": "First project",
      "progress": 45,
      "dueDate": "2026-06-01",
      "status": "ACTIVE",
      "priority": "HIGH"
    }
  ]
```

### Get Tasks / جلب المهام

```
Request / الطلب:
  GET /api/member/tasks/project/1
  Authorization: Bearer <token>

Response / الاستجابة:
  200 OK
  [
    {
      "id": 1,
      "title": "Setup database",
      "description": "Configure MariaDB",
      "projectId": 1,
      "assigneeId": 2,
      "status": "DOING",
      "priority": "HIGH",
      "dueDate": "2026-05-30",
      "orderIndex": 0
    }
  ]
```

### Update Task Status / تحديث حالة المهمة

```
Request / الطلب:
  PATCH /api/member/tasks/1/status?status=DONE
  Authorization: Bearer <token>

Response / الاستجابة:
  200 OK
  {
    "id": 1,
    "title": "Setup database",
    "status": "DONE",
    ...
  }
```

### Move Task / نقل المهمة

```
Request / الطلب:
  PATCH /api/member/tasks/1/move?status=REVIEW&orderIndex=2
  Authorization: Bearer <token>

Response / الاستجابة:
  200 OK
  {
    "id": 1,
    "title": "Setup database",
    "status": "REVIEW",
    "orderIndex": 2,
    ...
  }
```

### Send AI Command / إرسال أمر ذكاء اصطناعي

```
Request / الطلب:
  POST /api/ai/command
  Authorization: Bearer <token>
  Content-Type: application/json

  {
    "projectId": 1,
    "message": "Create a new task called 'Deploy to production' and assign it to John"
  }

Response / الاستجابة:
  200 OK
  {
    "actionId": 42,
    "requiresConfirmation": true,
    "aiMessage": "I've prepared a new task 'Deploy to production' for John. Please confirm.",
    "triggerMessage": "Create a new task...",
    "executedAction": {
      "actionType": "CREATE",
      "taskId": null,
      "title": "Deploy to production",
      "status": "TODO",
      "assigneeId": 3
    }
  }
```

### Confirm AI Action / تأكيد إجراء الذكاء الاصطناعي

```
Request / الطلب:
  POST /api/ai/confirm/42
  Authorization: Bearer <token>
  Content-Type: application/json

  {
    "approved": true
  }

Response / الاستجابة:
  200 OK
```

---

## User Roles & Permissions / أدوار المستخدمين والصلاحيات

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY / تسلسل الأدوار               │
│                                                                 │
│   ┌───────────┐                                                 │
│   │   ADMIN   │  • Full access to all projects                  │
│  │   المدير   │  • وصول كامل لجميع المشاريع                     │
│   │  العام    │  • Can list all projects (GET /api/manager/     │
│   └─────┬─────┘    projects)                                    │
│         │        • Can view any project detail                   │
│         │        • يمكنه عرض تفاصيل أي مشروع                    │
│         │                                                       │
│   ┌─────┴─────┐                                                 │
│   │  MANAGER  │  • Can view projects they manage                │
│  │  المدير    │  • يمكنه عرض المشاريع التي يديرها              │
│   └─────┬─────┘  • Can view project details                     │
│         │        • يمكنه عرض تفاصيل المشاريع                   │
│         │                                                       │
│   ┌─────┴─────┐                                                 │
│   │  MEMBER   │  • Can view projects they belong to             │
│  │   العضو    │  • يمكنه عرض المشاريع التي ينتمي إليها          │
│   └───────────┘  • Can update/move their tasks                  │
│                  • يمكنه تحديث/نقل مهامه                       │
│                  • Can use AI commands                          │
│                  • يمكنه استخدام أوامر الذكاء الاصطناعي        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Summary / ملخص تدفق البيانات

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   User Action /    Frontend /    API Call /     Backend /    Database│
│   إجراء المستخدم    الواجهة       الطلب          الخلفية       قاعدة  │
│                                                                      │
│   ─────────────    ─────────    ──────────     ─────────    ──────── │
│                                                                      │
│   Login      →    login()   →  POST          → Auth      → MariaDB │
│   تسجيل الدخول      api.ts      /api/auth/      Service      +Redis │
│                                  login                                    │
│                                                                      │
│   View       →    getProjects→  GET           → Project   → MariaDB │
│   Projects      ()  api.ts    /api/manager/     Service              │
│   عرض المشاريع                  projects                                   │
│                                                                      │
│   View       →    getProjectTasks→ GET         → Task      → MariaDB │
│   Tasks         () api.ts     /api/member/      Service              │
│   عرض المهام                  tasks/project/{id}                       │
│                                                                      │
│   Move       →    (via UI)  →  PATCH          → Task      → MariaDB │
│   Task                       /api/member/      Service    → WebSocket│
│   نقل المهمة                  tasks/{id}/move              → /topic/ │
│                                                            kanban/* │
│                                                                      │
│   AI Chat    →    sendAiCommand→ POST          → AI        → MariaDB │
│   محادثة ذكية   () api.ts     /api/ai/         Service    → LLM API │
│                                  command          │                  │
│                                                   ↓                  │
│                                              PendingAction           │
│                                              (if sensitive)          │
│                                              إذا كان حساساً         │
│                                                                      │
│   Confirm    →    confirmAiAction→ POST        → AI        → MariaDB │
│   Action        () api.ts     /api/ai/         Service              │
│   تأكيد إجراء                  confirm/{id}                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## WebSocket Real-Time Updates / التحديثات الفورية عبر WebSocket

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Client A   │         │   Backend    │         │   Client B   │
│   العميل أ   │         │   الخلفية    │         │   العميل ب   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  CONNECT /ws           │                        │
       │  Authorization: Bearer │                        │
       │  <token>               │                        │
       │ ──────────────────────>│                        │
       │                        │                        │
       │  SUBSCRIBE             │                        │
       │  /topic/kanban/1       │                        │
       │ ──────────────────────>│                        │
       │                        │                        │
       │                        │  PATCH /api/member/    │
       │                        │  tasks/5/move          │
       │                        │ <──────────────────────│
       │                        │                        │
       │                        │  TaskService updates   │
       │                        │  + broadcasts to topic │
       │                        │                        │
       │  MESSAGE               │  MESSAGE               │
       │  /topic/kanban/1       │  /topic/kanban/1       │
       │  { task moved event }  │  { task moved event }  │
       │ <──────────────────────│ ──────────────────────>│
       │                        │                        │
```

---

## Security Summary / ملخص الأمان

| Layer / الطبقة | Mechanism / الآلية | Details / التفاصيل |
|----------------|--------------------|--------------------|
| Transport | HTTPS (in production) | Encrypts all data in transit / تشفير البيانات أثناء النقل |
| Authentication | JWT (JSON Web Token) | Stateless, signed tokens / رموز موقعة بدون جلسات |
| Passwords | BCrypt | One-way hashing / تشفير أحادي الاتجاه |
| Authorization | Role-Based (RBAC) | ADMIN, MANAGER, MEMBER roles / أدوار المدير والعضو |
| CORS | Whitelist | Only localhost:3000 allowed / فقط localhost:3000 مسموح |
| Input Validation | @NotBlank | Required field validation / التحقق من الحقول المطلوبة |
| SQL Injection | JPA / Parameterized Queries | Safe by default / آمن افتراضياً |
| XSS | JSON API | No HTML rendering / لا عرض HTML |

---

## Frontend Routes ↔ API Mapping / ربط مسارات الواجهة بالـ API

| Frontend Route / مسار الواجهة | API Endpoints Used / نقاط الاتصال المستخدمة |
|-------------------------------|----------------------------------------------|
| `/login` | `POST /api/auth/login` |
| `/manager/dashboard` | `GET /api/manager/projects` |
| `/manager/project-detail` | `GET /api/manager/projects/{id}`, `GET /api/member/tasks/project/{id}` |
| `/manager/analytics` | `GET /api/manager/projects` |
| `/manager/create-project` | (Project creation endpoint - TBD / قيد التطوير) |
| `/member/kanban` | `GET /api/member/tasks/project/{id}`, `PATCH /api/member/tasks/{id}/move`, WebSocket `/ws` |
| `/member/my-tasks` | `GET /api/member/tasks/project/{id}` |
| `/member/task-detail` | `GET /api/member/tasks/project/{id}`, `PATCH /api/member/tasks/{id}/status` |
| `/admin/users` | (User management endpoints - TBD / قيد التطوير) |
| `/admin/teams` | (Team management endpoints - TBD / قيد التطوير) |
| `/admin/ai-settings` | `POST /api/ai/command` |
| `/admin/system-stats` | (Stats endpoints - TBD / قيد التطوير) |
| `/user/profile` | (Profile endpoints - TBD / قيد التطوير) |

---

*Generated on 2026-05-25 / تم الإنشاء في ٢٠٢٦-٠٥-٢٥*
