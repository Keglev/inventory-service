/**
 * @file LogoutPage.tsx
 * @module pages/auth/LogoutPage
 *
 * @summary
 * Public route that performs logout via a top-level form POST to `<API
 * origin>/logout?return=<origin>/logout-success` (api/apiBase).
 *
 * @enterprise
 * - Clears the React Query cache and AuthContext on mount, then navigates the browser away.
 * - Form-POST navigation (not XHR) avoids CORS/XHR-redirect issues on the
 *   Spring Security default /logout endpoint and guarantees server-side
 *   session invalidation followed by a clean cross-origin redirect.
 * - CSRF is off for /logout on the backend (08-concepts, CSRF row); a
 *   CSRF-protected /logout would need the token as a hidden form field.
 * - The only sign-out path the backend offers (backend ADR-0018).
 *
 * @i18n
 * Uses 'auth' namespace. Key: logoutSigningOut.
 */

import * as React from 'react';
import { useEffect } from 'react';
import { Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { apiUrl } from '../../api/apiBase';

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
    form.action = apiUrl(`/logout?return=${encodeURIComponent(returnUrl)}`);
    form.style.display = 'none';
    document.body.appendChild(form);
    form.submit();

    return () => {
      try { document.body.removeChild(form); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: one logout per visit to /logout
  }, []);

  // Progress UI while navigation occurs
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 3 }}>
      <Stack spacing={2} sx={{ textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('logoutSigningOut')}
        </Typography>
      </Stack>
    </Box>
  );
};

export default LogoutPage;
