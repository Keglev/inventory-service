/**
 * @file LogoutSuccess.tsx
 * @module pages/auth/LogoutSuccess
 *
 * @summary
 * Public confirmation screen shown after a successful server-side logout.
 * Pure UI — no side effects; all logout work happens in LogoutPage.
 *
 * @enterprise
 * - Separating the success view from the logout effect keeps the
 *   navigation-after-form-POST flow deterministic: the backend redirects
 *   the browser to /logout-success, which then renders this static page.
 * - Re-entry to /login is an explicit user action, not an auto-redirect,
 *   to avoid loops if the user lands here directly.
 *
 * @i18n
 * Uses 'auth' namespace. Keys: logoutSuccessTitle, logoutSuccessBody, signIn.
 */

import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LogoutSuccess: React.FC = () => {
  const { t } = useTranslation<'auth'>('auth');
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '70vh', px: 3 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 560 }}>
        <Typography variant="h5" gutterBottom>
          {t('logoutSuccessTitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {t('logoutSuccessBody')}
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/login', { replace: true })}
        >
          {t('signIn')}
        </Button>
      </Box>
    </Box>
  );
};

export default LogoutSuccess;
