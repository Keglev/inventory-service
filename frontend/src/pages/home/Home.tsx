/**
 * @file Home.tsx
 * @description
 * Landing hub for the root route (/):
 * - If authenticated, redirect to /dashboard.
 * - If not authenticated, show a small landing card with:
 *    • “Sign in” → /login
 *    • “Continue in Demo Mode” → starts a local DEMO session and opens /analytics/overview
 * - While auth state is hydrating, show a loading spinner.
 *
 * @enterprise
 * - Uses useAuth() to access auth state and start a DEMO session.
 * - Keeps history clean on redirects via <Navigate replace>.
 * - Minimal dependencies; no HTTP or side-effects beyond starting demo.
 */

import * as React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, CardHeader, Stack, Button, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../context/useAuth';
import { useTranslation } from 'react-i18next';

/**
 * Home component
 */
const Home: React.FC = () => {
  const { user, loading, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation<'auth'>('auth');

  // While auth state is hydrating, show a loading spinner
  if (loading) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If already authenticated, go straight to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  // Unauthenticated → show a small, focused landing with Sign in + Demo
  const handleDemo = () => {
    loginAsDemo();
    navigate('/analytics/overview', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Card sx={{ width: 480, maxWidth: '94vw' }}>
        <CardHeader
          title="SmartSupplyPro"
          subheader={t('welcome')}
        />
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('or')}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" onClick={() => navigate('/login')}>
                {t('signIn')}
              </Button>
              <Button variant="outlined" onClick={handleDemo}>
                {t('continueDemo', 'Continue in Demo Mode')}
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('ssoHint')}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Home;
