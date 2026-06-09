import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuthToken, removeAuthToken, setAuthToken } from "./api";
import { wsConnect, wsDisconnect } from "./websocket";

export interface User {
  id: number;
  username?: string;
  email: string;
  fullName?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("terra_user");
  return stored ? JSON.parse(stored) : null;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return getAuthToken();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      wsConnect(token).catch((err) =>
        console.warn("[Auth] WebSocket connection failed:", err)
      );
    }
    setIsLoading(false);

    return () => {
      wsDisconnect();
    };
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("terra_user", JSON.stringify(newUser));
    }
    setToken(newToken);
    setUser(newUser);
    wsConnect(newToken).catch((err) =>
      console.warn("[Auth] WebSocket connection failed:", err)
    );
  };

  const logout = () => {
    wsDisconnect();
    removeAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("terra_user");
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}