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

/**
 * Read the stored user role from localStorage.
 * Returns null if not authenticated or not in browser context.
 */
export function getStoredRole(): AppRole | null {
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

/**
 * Read auth token from localStorage.
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("terra_token");
}

/**
 * Guard: require authentication.
 * Call from `beforeLoad` on any route that needs a logged-in user.
 * Redirects to /login if no token is present.
 */
export function requireAuth() {
  if (!isAuthenticated()) {
    throw redirect({ to: "/login" });
  }
}

/**
 * Guard: require a specific role prefix.
 * Call from `beforeLoad` on role-scoped routes (e.g. /admin/*).
 * Redirects to the correct dashboard if the user has a different role.
 */
export function requireRole(prefix: string) {
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

/**
 * Guard: prevent authenticated users from accessing public pages
 * (login, register, forgot-password, etc.).
 * Redirects to role-appropriate dashboard if already logged in.
 */
export function requireGuest() {
  if (isAuthenticated()) {
    const role = getStoredRole();
    throw redirect({ to: role ? (roleHomeMap[role] ?? "/") : "/" });
  }
}
