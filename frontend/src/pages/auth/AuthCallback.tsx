/**
 * @file AuthCallback.tsx
 * @description 
 * -OAuth2 redirect target. Verifies session via api/me, hydrates AuthContext,
 * then redirects to /dashboard. On failure goes abck to /login with error.
 */
import * as React from 'react';
import { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import httpClient from '../../api/httpClient';
import { useAuth } from '../../hooks/useAuth';

/**
 * AuthCallback component
 * Handles the OAuth2 authentication callback and verifies the user session.
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { t } = useTranslation('auth');

  // On mount, verify the session by calling /api/me
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

  /**
   * Render the loading state while verifying the user session.
   */
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Box textAlign="center">
        <CircularProgress />
        <Typography variant="body2" mt={2}>
          {t('verifying', { defaultValue: 'Verifying your login…' })}
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthCallback;
