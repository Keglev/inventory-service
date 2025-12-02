/**
 * @file LoginPage.tsx
 * @description
 * Public login screen for Google OAuth2 SSO (SSO-only UX).
 * Local email/password fields are intentionally removed to avoid confusion.
 *
 * @features
 * - Google SSO button that redirects to backend OAuth2 endpoint.
 * - Error banner if `?error=` is present (e.g., user canceled consent).
 * - Optional: “Continue in Demo Mode” (client-only, read-only KPIs/Analytics).
 *
 * @i18n
 * - Uses react-i18next ('auth' namespace). See /public/locales for JSON files.
 * - Keys used: signIn, welcome, or, signInGoogle, ssoHint, errorTitle, continueDemo.
 */

import {
  Box, Card, CardContent, CardHeader, Stack,
  Button, Divider, Typography, Alert
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../api/httpClient';
import { useAuth } from '../../context/useAuth';

/**
 * Begin the OAuth2 Google SSO flow.
 * The backend whitelists the FE origin and will redirect back after success.
 */
function beginSso() {
  const origin = window.location.origin;
  const url = `${API_BASE}/oauth2/authorization/google?return=${encodeURIComponent(origin)}`;
  window.location.assign(url);
}

export default function LoginPage() {
  const { t } = useTranslation<'auth'>('auth');
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const oauthError = params.get('error');

  const { loginAsDemo } = useAuth();
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
              onClick={beginSso}
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
              {t('continueDemo', 'Continue in Demo Mode')}
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
