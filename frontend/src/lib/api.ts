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

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Attempt to parse JSON error message if possible
    let errorMsg = response.statusText;
    try {
      const errJson = await response.json();
      if (errJson.message) {
        errorMsg = errJson.message;
      }
    } catch (e) {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
}

// --- API Functions ---

// Auth
export const login = (data: any) => apiFetch<any>("/auth/login", { method: "POST", body: JSON.stringify(data) });

// Projects
export interface Project {
  id: number;
  name: string;
  description: string;
  progress: number;
  dueDate: string;
  status: string;
  priority: string;
}
export const getProjects = () => apiFetch<Project[]>("/manager/projects");

// AI Chat
export interface AiCommandRequest {
  message: string;
  projectId: number;
}
export interface AiCommandResponse {
  actionId?: number;
  requiresConfirmation: boolean;
  executedAction?: any;
  aiMessage: string;
  triggerMessage: string;
}
export const sendAiCommand = (data: AiCommandRequest) => apiFetch<AiCommandResponse>("/ai/command", { method: "POST", body: JSON.stringify(data) });
export const confirmAiAction = (actionId: number, approved: boolean) => apiFetch<void>(`/ai/confirm/${actionId}`, { method: "POST", body: JSON.stringify({ approved }) });
export const getPendingActions = () => apiFetch<any[]>("/ai/pending-actions");
export const dismissPendingAction = (actionId: number) => apiFetch<void>(`/ai/pending-actions/${actionId}`, { method: "DELETE" });

// Tasks
export const getProjectTasks = (projectId: number) => apiFetch<any[]>(`/member/tasks/project/${projectId}`);
