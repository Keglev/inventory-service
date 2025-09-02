// src/context/AuthProvider.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import httpClient from '../api/httpClient';
import { AuthContext } from './AuthContext';
import type { AppUser, AuthContextType } from './authTypes';

/**
 * Authentication provider component for session-cookie OAuth2.
 *
 * Responsibilities:
 *  - Hydrate user on app start via GET /api/me (401 JSON if unauthenticated).
 *  - Provide login() to initiate Google OAuth2 (authorization code).
 *  - Provide logout() to POST /logout and clear local state.
 *
 * Notes:
 *  - withCredentials: true is required so the browser sends/receives JSESSIONID.
 *  - Backend endpoints:
 *      - OAuth entry: /oauth2/authorization/google
 *      - User profile: GET /api/me
 *      - Logout: POST /logout
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    httpClient
      .get('/api/me', { withCredentials: true })
      .then((res) => {
        if (!cancelled) setUser(res.data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const login: AuthContextType['login'] = () => {
    const base = (import.meta.env.VITE_API_BASE as string) || '';
    window.location.href = `${base}/oauth2/authorization/google`;
  };

  const logout: AuthContextType['logout'] = () => {
    httpClient.post('/logout', {}, { withCredentials: true }).finally(() => {
      setUser(null);
      navigate('/login', { replace: true });
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
