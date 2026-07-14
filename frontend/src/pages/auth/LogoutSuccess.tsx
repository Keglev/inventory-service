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
 * - Two exits, not one: signing in again and returning to the public landing
 *   page. A single sign-in button dead-ends a visitor who only wanted to end the
 *   session, which is the last screen many first-time visitors see.
 *
 * @i18n
 * Uses 'auth' namespace. Keys: logoutSuccessTitle, logoutSuccessBody, signIn,
 * logoutBackHome.
 */

import * as React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="center"
          sx={{ mt: 3 }}
        >
          <Button
            variant="contained"
            onClick={() => navigate('/login', { replace: true })}
          >
            {t('signIn')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/', { replace: true })}
          >
            {t('logoutBackHome')}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default LogoutSuccess;
