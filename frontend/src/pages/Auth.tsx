// src/pages/Auth.tsx
import React, { useEffect } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
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
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await httpClient.get("/api/me");
        if (!cancelled) {
          setUser({ email: data.email, fullName: data.fullName, role: data.role });
          navigate("/dashboard", { replace: true });
        }
      } catch {
        // stay on /login and show the button
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, setUser]);

  const onGoogleLogin = () => {
    // Use the same base URL your httpClient uses
    // If your httpClient has baseURL baked in, just hit the absolute backend host:
    const API_BASE = (import.meta.env.VITE_API_BASE) || "https://inventoryservice.fly.dev";
    window.location.href = `${API_BASE}/oauth2/authorization/google`;
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "70vh", p: 2 }}>
      <Paper sx={{ p: 4, maxWidth: 520, width: "100%", textAlign: "center" }} elevation={2}>
        <Typography variant="h5" gutterBottom>Sign in</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Use your Google account to continue.
        </Typography>
        <Button variant="contained" onClick={onGoogleLogin} sx={{ mt: 2 }}>
          Login with Google
        </Button>
      </Paper>
    </Box>
  );
};

export default Auth;
