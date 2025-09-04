// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import httpClient from '../api/httpClient';
import { useAuth } from '../context/useAuth';

/**
 * OAuth2 callback handler:
 * - Invoked by the OAuth2 provider (Google) after user signs in and grants permissions.
 * - The backend has already processed the callback, created a session, and set a JSESSIONID cookie.
 * - This component verifies the session by calling /api/me, updates the auth context, and redirects to /dashboard.
 * - If verification fails, redirects to /login.
 * - While verifying, shows a loading spinner.
 * Notes:
 * 
 * - We do NOT redirect to /login on 401; this component IS the /login page.
 * - `withCredentials: true` is required so the browser sends/receives JSESSIONID.
 * /
 * @returns {JSX.Element}
 */
export default function AuthCallback() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // On mount, verify the session and fetch user info
  useEffect(() => {
    (async () => {
      try {
        const res = await httpClient.get('/api/me');
        setUser(res.data);                  // { email, fullName, role }
        navigate('/dashboard', { replace: true });
      } catch {
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, setUser]);

  // While verifying, show a loading spinner
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Box textAlign="center">
        <CircularProgress />
        <Typography variant="body2" mt={2}>Verifying your login…</Typography>
      </Box>
    </Box>
  );
}
