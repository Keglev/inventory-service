/**
 * @file NotFoundPage.tsx
 * @module pages/system/NotFoundPage
 *
 * @summary
 * Generic 404 page for unknown routes. Intentionally lightweight and
 * neutral — no telemetry, no diagnostics, no branded illustration.
 *
 * @enterprise
 * - Primary action adapts to auth state: routes to /dashboard for an
 *   authenticated user, /login otherwise. Avoids an extra hop through
 *   Home for the common signed-in case.
 * - Uses three namespaces (system, common, auth) directly rather than a
 *   single nested key path, keeping translation files cleanly scoped per
 *   feature and avoiding cross-namespace key collisions.
 * - Extension point: when a router-level diagnostic correlation layer is
 *   added, this page can surface a correlation ID without behavior change.
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
