/**
 * @file LogoutSuccess.tsx
 * @description
 * Public confirmation screen shown after a successful logout.
 * Side-effects happen exclusively in LogoutPage.
 *
 * @responsibilities
 * - Display a confirmation message after successful logout.
 * - Provide a button to navigate back to the login page.
 *
 * @i18n
 * - Uses 'auth' namespace: logoutSuccessTitle, logoutSuccessBody, signIn.
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
