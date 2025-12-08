/**
 * @file LogoutPage.tsx
 * @description
 * Public route that performs logout without XHR:
 *  - Clears React Query cache and AuthContext immediately (client-side).
 *  - Submits a top-level POST form to `${API_BASE}/logout?return=<origin>/logout-success`.
 *  - Avoids CORS/XHR redirect issues and guarantees server-side session invalidation.
 *
 * @enterprise
 * - Uses form POST navigation to bypass CORS on /logout.
 * - Works when CSRF is disabled. If CSRF is enabled in future, allow GET logout
 *   or include the CSRF token as a hidden field.
 *
 * @i18n
 * - Uses 'auth' namespace: logoutSigningOut.
 */

import * as React from 'react';
import { useEffect } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../api/httpClient';

const LogoutPage: React.FC = () => {
  const { t } = useTranslation<'auth'>('auth');
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  useEffect(() => {
    // 1) Clear client-side state immediately
    queryClient.clear();
    logout();

    // 2) Submit a real form POST to /logout with a return URL
    const form = document.createElement('form');
    form.method = 'POST';
    const returnUrl = `${window.location.origin}/logout-success`;
    form.action = `${API_BASE}/logout?return=${encodeURIComponent(returnUrl)}`;
    form.style.display = 'none';
    document.body.appendChild(form);
    form.submit();

    return () => {
      try { document.body.removeChild(form); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Progress UI while navigation occurs
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 3 }}>
      <Stack spacing={2} sx={{ textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          {t('logoutSigningOut')}
        </Typography>
      </Stack>
    </Box>
  );
};

export default LogoutPage;
