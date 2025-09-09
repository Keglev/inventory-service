/**
 * @file NotFoundPage.tsx
 * @description
 * Generic 404 page for unknown routes. Keep intentionally lightweight and neutral.
 *
 * @enterprise
 * - Internationalized copy (uses i18n).
 * - Offers clear next steps: go to Dashboard if logged in, otherwise to Login.
 * - This page can be extended with error correlation IDs when backed by a router
 *   that collects diagnostics.
 */

import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useTranslation } from 'react-i18next';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const primaryAction = () => {
    navigate(user ? '/dashboard' : '/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', px: 3 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 560 }}>
        <Typography variant="h4" gutterBottom>
          {t('system.notFound.title', 'Seite nicht gefunden')}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {t(
            'system.notFound.body',
            'Die von Ihnen aufgerufene Seite existiert nicht oder wurde verschoben.'
          )}
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={primaryAction}>
          {user ? t('nav.dashboard', 'Übersicht') : t('auth.signIn', 'Anmelden')}
        </Button>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
