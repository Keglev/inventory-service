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
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const NotFoundPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // One t() per namespace keeps typing precise and avoids prefixing "system."
  const { t } = useTranslation('system');
  const { t: tCommon } = useTranslation('common');
  const { t: tAuth } = useTranslation('auth');

  const primaryAction = () => {
    navigate(user ? '/dashboard' : '/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', px: 3 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 560 }}>
        <Typography variant="h4" gutterBottom>
          {t('notFound.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {t('notFound.body')}
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={primaryAction}>
          {user ? tCommon('nav.dashboard') : tAuth('signIn')}
        </Button>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
