import { createContext, useContext, useState, useCallback, type ReactNode, useEffect } from 'react';
import { loginWithPassword } from '../api/auth';
import { setAuthToken } from '../api/http';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginWithPassword(username, password);
    setToken(data.access_token);
    setAuthToken(data.access_token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAuthToken(null);
  }, []);

  // Keep axios token in sync
  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
