import { redirect } from "@tanstack/react-router";

export type AppRole = "ADMIN" | "MANAGER" | "MEMBER" | "USER";

const rolePrefixMap: Record<AppRole, string> = {
  ADMIN: "/admin",
  MANAGER: "/manager",
  MEMBER: "/member",
  USER: "/user",
};

const roleHomeMap: Record<AppRole, string> = {
  ADMIN: "/admin/system-stats",
  MANAGER: "/manager/dashboard",
  MEMBER: "/member/kanban",
  USER: "/user/profile",
};

function getStoredRole(): AppRole | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("terra_user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    return user.role as AppRole | null;
  } catch {
    return null;
  }
}

function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("terra_token");
}

export function requireAuth() {
  if (typeof window === "undefined") return;
  if (!isAuthenticated()) {
    throw redirect({ to: "/login" });
  }
}

export function requireRole(prefix: string) {
  if (typeof window === "undefined") return;
  requireAuth();
  const role = getStoredRole();
  if (!role) {
    throw redirect({ to: "/login" });
  }
  const expectedPrefix = rolePrefixMap[role];
  if (prefix !== expectedPrefix) {
    throw redirect({ to: roleHomeMap[role] ?? "/" });
  }
}

export function requireGuest() {
  if (typeof window === "undefined") return;
  if (isAuthenticated()) {
    const role = getStoredRole();
    throw redirect({ to: role ? (roleHomeMap[role] ?? "/") : "/" });
  }
}