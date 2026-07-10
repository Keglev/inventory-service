/**
 * @file Home.tsx
 * @module pages/home/Home
 *
 * @summary
 * Landing hub for the root route (/). Three states:
 *  - Auth hydrating: centered spinner.
 *  - Authenticated: redirect to /dashboard with history replace.
 *  - Unauthenticated: landing card with “Sign in” and “Continue in Demo Mode”.
 *
 * @enterprise
 * - Uses Navigate replace on the authenticated branch so the root URL never
 *   accumulates in browser history once a session exists.
 * - Demo Mode is a client-only read-only session started via useAuth; it
 *   does not call the backend and is acceptable for portfolio walkthroughs
 *   without provisioning a real account.
 * - Minimal dependencies: no HTTP, no global side effects beyond starting
 *   the demo session and navigating.
 *
 * @i18n
 * Uses 'auth' namespace. Keys: welcome, or, signIn, continueDemo, ssoHint.
 *
 * CB-APP66: t('continueDemo') retains an English fallback string at the JSX
 * site — tracked for i18n cleanup.
 */

import * as React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, CardHeader, Stack, Button, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

/**
 * Home component.
 * Routes the user based on auth state and offers a demo-session entry point.
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

  // If already authenticated, redirect to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  // Unauthenticated: show landing card with sign-in and demo options.
  const handleDemo = () => {
    loginAsDemo();
    navigate('/dashboard', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Card sx={{ width: 480, maxWidth: '94vw' }}>
        {/* Card header with branding */}
        <CardHeader
          title="SmartSupplyPro"
          subheader={t('welcome')}
        />
        <CardContent>
          <Stack spacing={2}>
            {/* Divider text */}
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('or')}
            </Typography>
            {/* Action buttons: Sign in or Demo mode */}
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" onClick={() => navigate('/login')}>
                {t('signIn')}
              </Button>
              <Button variant="outlined" onClick={handleDemo}>
                {t('continueDemo')}
              </Button>
            </Stack>
            {/* SSO hint text */}
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
