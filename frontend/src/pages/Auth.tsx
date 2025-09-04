// src/pages/Auth.tsx
import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import httpClient from '../api/httpClient';

/**
 * Login page:
 * - If already authenticated (session cookie present), redirect to /dashboard.
 * - Otherwise, render a "Continue with Google" CTA that starts the OAuth2 flow.
 *
 * Notes:
 *  - We do NOT redirect to /login on 401; this component IS the /login page.
 *  - `withCredentials: true` is required so the browser sends/receives JSESSIONID.
 */
const Auth: React.FC = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [ checking ] = useState(true);
  const API_BASE = import.meta.env.VITE_API_BASE as string;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await httpClient.get('/api/me');
        if (!cancelled) {
          setUser({
            email: data.email,
            fullName: data.fullName ?? data.name ?? data.email,
            role: data.role ?? (data.authorities?.[0] ?? "USER"),
          });
          navigate('/dashboard', { replace: true });
        }
      } catch {
        /* stay on login */
      } 
    })();
    return () => { cancelled = true;};
  }, [navigate, setUser]);

  if (checking) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Verifying your login…
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Welcome to Smart Supply Pro
        </Typography>
        <Button variant="contained" onClick={() => { window.location.href = `${API_BASE}/oauth2/authorization/google`;}}
        >
          Login with Google
        </Button>
      </Box>
    </Box>
  );
};

export default Auth;
