import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type User = {
  email: string;
  name: string | null;
  role: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ requirePasswordReset?: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isStudent: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'vidhyapika_token';
const USER_KEY = 'vidhyapika_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Next.js can render on the server; localStorage is only available in the browser.
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      const saved = localStorage.getItem(USER_KEY);
      setToken(t);
      setUser(saved ? JSON.parse(saved) : null);
    } finally {
      setReady(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
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

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
