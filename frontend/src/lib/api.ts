export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("terra_token");
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("terra_token", token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("terra_token");
  }
};

const BASE_URL = "http://localhost:8080/api";

let refreshPromise: Promise<string | null> | null = null;

async function refreshToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.accessToken) {
        setAuthToken(data.accessToken);
        return data.accessToken;
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const doFetch = async (authToken?: string): Promise<Response> => {
    const h = { ...headers };
    if (authToken) {
      h["Authorization"] = `Bearer ${authToken}`;
    }
    return fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: h,
    });
  };

  let response = await doFetch();

  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      response = await doFetch(newToken);
    } else {
      removeAuthToken();
      localStorage.removeItem("terra_user");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("انتهت الجلسة. يرجى تسجيل الدخول مجدداً.");
    }
  }

  if (!response.ok) {
    let errorMsg = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson.message) {
        errorMsg = errJson.message;
      }
    } catch {
    }
    throw new Error(errorMsg);
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  type: string;
  id: number;
  email: string;
  roles: string[];
}

export const login = (data: { email: string; password: string }): Promise<AuthResponse> =>
  apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) });

export const register = (data: {
  username: string;
  email: string;
  password: string;
  fullName: string;
}): Promise<{ message: string }> =>
  apiFetch<{ message: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) });

export const verifyEmail = (data: { email: string; token: string }): Promise<{ message: string }> =>
  apiFetch<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const forgotPassword = (data: { email: string }): Promise<{ message: string }> =>
  apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const resetPassword = (data: {
  email: string;
  token: string;
  newPassword: string;
}): Promise<{ message: string }> =>
  apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
// ─── Types ───────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING";
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
  status?: "ACTIVE" | "SUSPENDED" | "PENDING";
  avatarUrl?: string;
  bio?: string;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────
// بدلاً من api.get / api.put / api.patch / api.delete
export const getUsers = (): Promise<AdminUser[]> =>
  apiFetch<AdminUser[]>("/admin/users/manage?size=200")
    .then(res => res.content)
export const updateUser = (id: number, data: AdminUpdateUserRequest): Promise<AdminUser> =>
  apiFetch<AdminUser>(`/admin/users/manage/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const setUserStatus = (id: number, status: "ACTIVE" | "SUSPENDED" | "PENDING"): Promise<AdminUser> =>
  apiFetch<AdminUser>(`/admin/users/manage/${id}/status?status=${status}`, { method: "PATCH" });

export const deleteUser = (id: number): Promise<void> =>
  apiFetch<void>(`/admin/users/manage/${id}`, { method: "DELETE" });
export interface Project {
  id: number;
  name: string;
  description: string;
  teamId?: number;
  managerId?: number;
  progress: number;
  dueDate?: string;
  status: string;
  priority: string;
  createdAt?: string;
}

export const getProjects = () => apiFetch<Project[]>("/manager/projects");

export const getProjectById = (id: number): Promise<Project> =>
  apiFetch<Project>(`/manager/projects/${id}`);

export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

export const getProjectMembers = (projectId: number): Promise<User[]> =>
  apiFetch<User[]>(`/manager/projects/${projectId}/members`);

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export const getProjectStats = (projectId: number): Promise<ProjectStats> =>
  apiFetch<ProjectStats>(`/manager/projects/${projectId}/stats`);

export interface CreateProjectRequest {
  name: string;
  description?: string;
  teamId?: number;
  dueDate?: string;
  priority?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  teamId?: number;
  dueDate?: string;
  priority?: string;
  status?: string;
}

export const createProject = (data: CreateProjectRequest): Promise<Project> =>
  apiFetch<Project>("/manager/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateProject = (id: number, data: UpdateProjectRequest): Promise<Project> =>
  apiFetch<Project>(`/manager/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteProject = (id: number): Promise<void> =>
  apiFetch<void>(`/manager/projects/${id}`, { method: "DELETE" });

export interface ManagerAnalytics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export const getManagerAnalytics = (): Promise<ManagerAnalytics> =>
  apiFetch<ManagerAnalytics>("/manager/analytics");

export interface AiCommandRequest {
  message: string;
}
export const getManagerTeams = (): Promise<Team[]> =>
  apiFetch<Team[]>("/manager/teams");

export interface AiCommandResponse {
  actionId?: number;
  requiresConfirmation: boolean;
  executedAction?: {
    actionType: string;
    taskId: number | null;
    title?: string;
    taskTitle?: string;
    newStatus?: string;
    status?: string;
    priority?: string;
    assigneeId?: number | null;
  };
  aiMessage: string;
  triggerMessage: string;
}

export const sendAiCommand = (data: AiCommandRequest) =>
  apiFetch<AiCommandResponse>("/ai/command", { method: "POST", body: JSON.stringify(data) });

export const confirmAiAction = (actionId: number, approved: boolean) =>
  apiFetch<void>(`/ai/confirm/${actionId}`, {
    method: "POST",
    body: JSON.stringify({ approved }),
  });

export interface PendingAction {
  id: number;
  userId?: number;
  actionType: string;
  targetId?: number;
  naturalLanguageCommand?: string;
  status: string;
}

export const getPendingActions = () => apiFetch<PendingAction[]>("/ai/pending-actions");

export const dismissPendingAction = (actionId: number) =>
  apiFetch<void>(`/ai/pending-actions/${actionId}`, { method: "DELETE" });

export interface AiSettings {
  provider: string;
  model: string;
  apiKeyMasked: string;
  enabled: boolean;
  defaultModel: string;
  apiUrl: string;
}

export const getAiSettings = (): Promise<AiSettings> => apiFetch<AiSettings>("/ai/settings");

export const updateAiSettings = (
  data: Partial<AiSettings> & { apiKey?: string },
): Promise<{ message: string }> =>
  apiFetch<{ message: string }>("/ai/settings", {
    method: "POST",
    body: JSON.stringify(data),
  });

export interface KanbanInsight {
  id: number;
  suggestionType: string;
  taskIds?: string;
  message?: string;
  isDismissed: boolean;
  createdAt?: string;
}

export const getKanbanInsights = (projectId: number): Promise<KanbanInsight[]> =>
  apiFetch<KanbanInsight[]>(`/ai/insights/kanban/${projectId}`);

export interface AnalyticsInsight {
  id: number;
  suggestionType: string;
  taskIds?: string;
  message?: string;
  isDismissed: boolean;
  createdAt?: string;
}

export const getAnalyticsInsights = (): Promise<AnalyticsInsight[]> =>
  apiFetch<AnalyticsInsight[]>("/ai/insights/analytics");

export const dismissInsight = (insightId: number): Promise<void> =>
  apiFetch<void>(`/ai/insights/${insightId}/dismiss`, { method: "POST" });



export interface NotificationResponse {
  id: number;
  type: string;
  content: string;
  createdAt: string;
  targetId?: number;
  isRead: boolean;
  sourceUserName?: string;
}
export const getUnreadNotifications = (): Promise<NotificationResponse[]> =>
  apiFetch<NotificationResponse[]>("/notifications/unread");

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

export const getRecentNotifications = (
  page = 0,
  size = 20,
): Promise<Page<NotificationResponse>> =>
  apiFetch<Page<NotificationResponse>>(
    `/notifications/recent?page=${page}&size=${size}`,
  );

export const markNotificationsAsRead = (notificationIds: number[]): Promise<void> =>
  apiFetch<void>("/notifications/read", {
    method: "POST",
    body: JSON.stringify({ notificationIds }),
  });
export const getRecentActivity = (): Promise<NotificationResponse[]> =>
  apiFetch<NotificationResponse[]>("/notifications/recent");

export interface SystemStats {
  totalUsers: number;
  activeProjects: number;
  completedTasksThisMonth: number;
  uptime: string;
}

export const getSystemStats = (): Promise<SystemStats> => apiFetch<SystemStats>("/admin/stats");

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

// export const getUsers = (): Promise<AdminUser[]> =>
//   apiFetch<AdminUser[]>("/admin/users");

export const getAdminUsers = (): Promise<AdminUser[]> =>
  apiFetch<AdminUser[]>("/admin/users");

export interface Team {
  id: number;
  name: string;
  description: string | null;
  leadName: string | null;
  leadId: number | null;
  memberIds: number[];
  memberCount: number;
}

export interface TeamPayload {
  name: string;
  description: string;
  leadId: number | null;
  memberIds: number[];
}

export const getTeams = (): Promise<Team[]> =>
  apiFetch<Team[]>("/admin/teams");

export const createTeam = (data: TeamPayload): Promise<Team> =>
  apiFetch<Team>("/admin/teams", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateTeam = (id: number, data: TeamPayload): Promise<Team> =>
  apiFetch<Team>(`/admin/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteTeam = (id: number): Promise<void> =>
  apiFetch<void>(`/admin/teams/${id}`, { method: "DELETE" });

export interface Task {
  id: number;
  title: string;
  description: string;
  assigneeId?: number | null;
  assigneeName?: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  projectId: number;
  orderIndex?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const getProjectTasks = (projectId: number): Promise<Task[]> =>
  apiFetch<Task[]>(`/member/tasks/project/${projectId}`);

export const getMyTasks = (): Promise<Task[]> =>
  apiFetch<Task[]>("/member/tasks/assigned");

export const getTaskById = (id: number): Promise<Task> =>
  apiFetch<Task>(`/member/tasks/${id}`);

export const createTask = (projectId: number, data: {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: number | null;
  dueDate?: string | null;
}): Promise<Task> =>
  apiFetch<Task>(`/member/tasks/project/${projectId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateTaskStatus = (taskId: number, status: string): Promise<Task> =>
  apiFetch<Task>(`/member/tasks/${taskId}/status?status=${status}`, {
    method: "PATCH",
  });

export const moveTask = (taskId: number, status: string, orderIndex: number): Promise<Task> =>
  apiFetch<Task>(`/member/tasks/${taskId}/move?status=${status}&orderIndex=${orderIndex}`, {
    method: "PATCH",
  });

export const deleteTask = (taskId: number): Promise<void> =>
  apiFetch<void>(`/member/tasks/${taskId}`, { method: "DELETE" });

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  userFullName: string;
  taskId: number;
}
export const updateTask = (
  taskId: number,
  data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assigneeId?: number | null;
    dueDate?: string | null;
  }
): Promise<Task> =>
  apiFetch<Task>(`/member/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const createComment = (taskId: number, data: { content: string }): Promise<Comment> =>
  apiFetch<Comment>(`/member/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const getTaskComments = (taskId: number): Promise<Comment[]> =>
  apiFetch<Comment[]>(`/member/tasks/${taskId}/comments`);
export const addComment = (taskId: number, content: string): Promise<Comment> =>
  apiFetch<Comment>(`/member/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

export const updateComment = (taskId: number, commentId: number, content: string): Promise<Comment> =>
  apiFetch<Comment>(`/member/tasks/${taskId}/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });

export const deleteComment = (taskId: number, commentId: number): Promise<void> =>
  apiFetch<void>(`/member/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
export const getMyProjects = (): Promise<Project[]> => apiFetch<Project[]>("/member/projects");

