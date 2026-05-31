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
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    // Restore session from localStorage on mount
    const storedToken = getAuthToken();
    const storedUser = localStorage.getItem("terra_user");
    if (storedToken && storedUser) {
      try {
        setTokenState(storedToken);
        setUser(JSON.parse(storedUser));
        // Reconnect WebSocket for restored sessions
        wsConnect(storedToken).catch((err) =>
          console.warn("[Auth] WS reconnect failed:", err),
        );
      } catch {
        removeAuthToken();
        localStorage.removeItem("terra_user");
      }
    }

    // Disconnect WebSocket on unmount (app teardown)
    return () => {
      wsDisconnect();
    };
  }, []);

  const login = (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    localStorage.setItem("terra_user", JSON.stringify(newUser));
    setTokenState(newToken);
    setUser(newUser);
    // Establish WebSocket connection after login
    wsConnect(newToken).catch((err) =>
      console.warn("[Auth] WS connect failed:", err),
    );
  };

  const logout = () => {
    // Tear down WebSocket before clearing credentials
    wsDisconnect();
    removeAuthToken();
    localStorage.removeItem("terra_user");
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
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
