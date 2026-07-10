/**
 * @file LoginPage.tsx
 * @module pages/auth/LoginPage
 *
 * @summary
 * Public login screen for Google OAuth2 SSO (SSO-only UX). Local
 * email/password fields are intentionally absent to keep the auth model
 * unambiguous in the portfolio.
 *
 * @enterprise
 * - SSO-only by design: removes credential-handling responsibility from the
 *   frontend and shifts it to the IdP. Demo Mode is a client-only read-only
 *   session and does not call the backend.
 * - Renders an error banner when ?error= is present in the URL (typical when
 *   the user cancels Google consent or the OAuth2 callback fails).
 *
 * @i18n
 * Uses 'auth' namespace. Keys: signIn, welcome, or, signInGoogle, ssoHint,
 * errorTitle, continueDemo.
 *
 * CB-APP66: t('continueDemo') retains an English fallback string at the JSX
 * site — tracked for the i18n cleanup pass (no behavior change here).
 */

import {
  Box, Card, CardContent, CardHeader, Stack,
  Button, Divider, Typography, Alert
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { t } = useTranslation<'auth'>('auth');
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const oauthError = params.get('error');

  const { loginAsDemo, login } = useAuth();
  const navigate = useNavigate();

  const handleDemo = () => {
    loginAsDemo();
    navigate('/dashboard', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center', px: 2 }}>
      <Card sx={{ width: 480, maxWidth: '94vw' }}>
        <CardHeader title={t('signIn')} subheader={t('welcome')} />
        <CardContent>
          {oauthError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>{t('errorTitle')}</strong>
            </Alert>
          )}

          <Stack spacing={2}>
            <Button
              type="button"
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={login}
              aria-label={t('signInGoogle')}
            >
              {t('signInGoogle')}
            </Button>

            <Divider>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('or')}
              </Typography>
            </Divider>

            {/* Demo entry (client-only, read-only) */}
            <Button variant="text" onClick={handleDemo}>
              {t('continueDemo')}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('ssoHint')}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
