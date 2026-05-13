import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import api, { setAccessToken } from "../api/client";
import { User } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  isOwner: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Try to restore session on mount — use plain axios, not the intercepted api instance
  useEffect(() => {
    axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setUser(res.data.user);
      })
      .catch(() => {
        // Not logged in — that's fine
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post("/auth/login", { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (email: string, password: string, fullName: string, phone?: string) => {
    const res = await api.post("/auth/register", { email, password, fullName, phone });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setAccessToken(null);
    setUser(null);
  };

  const isOwner = () => user?.role === "owner" || user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
