/**
 * @file AuthCallback.tsx
 * @module pages/auth/AuthCallback
 *
 * @summary
 * OAuth2 redirect target: verifies the session via GET /api/me, then redirects to /dashboard.
 *
 * @enterprise
 * - Hydrates AuthContext with the returned profile; on failure, redirects to
 *   /login?error=session.
 * - Session verification is mount-only and guarded against unmount races
 *   via a cancelled flag, preventing setState on an unmounted component.
 * - Backend contract (AuthController.me): { email, fullName, role, pictureUrl }.
 *   AuthContext keeps no pictureUrl, so the avatar shows initials.
 *
 * @i18n
 * Uses 'auth' namespace. Key: verifying.
 */
import * as React from 'react';
import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import httpClient from '../../api/httpClient';
import { useAuth } from '../../hooks/useAuth';

/**
 * AuthCallback component.
 * Renders a centered spinner while session verification is in flight.
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { t } = useTranslation('auth');

  // Verify session on mount; cancelled flag prevents setState after unmount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await httpClient.get('/api/me');
        if (!cancelled) {
          setUser({ email: data.email, fullName: data.fullName, role: data.role });
          navigate('/dashboard', { replace: true });
        }
      } catch {
        if (!cancelled) navigate('/login?error=session', { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, setUser]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('verifying')}
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthCallback;
