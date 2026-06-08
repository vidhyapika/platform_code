import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type User = {
  email: string;
  name: string | null;
  role: string;
};

export type LoginPortal = 'student' | 'parent' | 'admin';

type AuthContextType = {
  token: string | null;
  user: User | null;
  ready: boolean;
  login: (
    email: string,
    password: string,
    portal?: LoginPortal
  ) => Promise<{ requirePasswordReset?: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isStudent: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const TOKEN_KEY = 'vidhyapika_token';
export const USER_KEY = 'vidhyapika_user';
export const SESSION_EXPIRED_EVENT = 'vidhyapika:session-expired';

export function readStoredSession(): { token: string | null; user: User | null } {
  if (typeof window === 'undefined') return { token: null, user: null };
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const saved = localStorage.getItem(USER_KEY);
    return { token, user: saved ? JSON.parse(saved) : null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initial = readStoredSession();
  const [token, setToken] = useState<string | null>(initial.token);
  const [user, setUser] = useState<User | null>(initial.user);
  const [ready, setReady] = useState(typeof window !== 'undefined');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setReady(true);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    const onSessionExpired = () => logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [logout]);

  const login = useCallback(async (email: string, password: string, portal?: LoginPortal) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ...(portal ? { portal } : {}) }),
    });
    const data = await res.json();

    if (!res.ok) return { error: data.error ?? 'Login failed' };
    if (data.requirePasswordReset) return { requirePasswordReset: true };

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return {};
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        ready,
        login,
        logout,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useAuthToken(): string | null {
  return useContext(AuthContext)?.token ?? null;
}
