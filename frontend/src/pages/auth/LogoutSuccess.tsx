/**
 * @file LogoutSuccess.tsx
 * @description
 * Public confirmation screen shown after a successful logout.
 * No side-effects here; the actual logout happens in LogoutPage
 *
 * @responsibilities
 * - Display a confirmation message after successful logout.
 * - Provide a button to navigate back to the login page.
 * /logout (protected) performs cleanup and redirects to this route.
 *
 */
import * as React from 'react';
import { useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import httpClient from '../../api/httpClient';
import { useAuth } from '../../context/useAuth';

const LogoutSuccess: React.FC = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const { logout } = useAuth();

  // Legacy support: /logout-success?auto=1 triggers cleanup (older flow).
  useEffect(() => {
    if (params.get('auto') === '1') {
      (async () => {
        try { await httpClient.post('/api/auth/logout'); } catch { /* ignore */ }
        finally { logout(); }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh', px: 3 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 560 }}>
        <Typography variant="h5" gutterBottom>
          {t('logoutTitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {t('logoutBody')}
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/login', { replace: true })}>
          {t('signIn')}
        </Button>
      </Box>
    </Box>
  );
};

export default LogoutSuccess;
