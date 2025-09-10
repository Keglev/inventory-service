/**
 * @file LogoutPage.tsx
 * @description
 * Public route that performs logout:
 *  - POST /logout (idempotent; ignores 4xx/5xx)
 *  - Clears React Query cache and AuthContext
 *  - Redirects user to `/logout-success`
 *
 * @enterprise
 * - Separates side effects from the confirmation screen.
 * - Provides visible progress and retry on failure (network or CSRF edge cases).
 *
 * @i18n
 * - Uses 'auth' namespace keys: logoutSigningOut, logoutFailed, errorTryAgain.
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import httpClient from '../../api/httpClient';
import { useAuth } from '../../context/useAuth';
import { Box, CircularProgress, Button, Typography, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

const LogoutPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const runLogout = async () => {
    setFailed(false);
    try {
      // IMPORTANT: public endpoint as per Spring Security default
      await httpClient.post('/logout');
    } catch {
      // Network/CSRF issues shouldn't trap the user
      setFailed(true);
    } finally {
      queryClient.clear();
      logout();
      setDone(true);
    }
  };

  useEffect(() => {
    void runLogout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done && !failed) return <Navigate to="/logout-success" replace />;

  // If call failed, still clean local state and offer retry (rare edge)
  if (done && failed) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 3 }}>
        <Stack spacing={2} sx={{ textAlign: 'center' }}>
          <Typography variant="h6">{t('logoutFailed')}</Typography>
          <Button variant="outlined" onClick={runLogout}>{t('errorTryAgain')}</Button>
        </Stack>
      </Box>
    );
  }

  // In-flight
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh', px: 3 }}>
      <Stack spacing={2} sx={{ textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">{t('logoutSigningOut')}</Typography>
      </Stack>
    </Box>
  );
};

export default LogoutPage;
