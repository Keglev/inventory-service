/**
 * @file LoginPage.tsx
 * @description
 * Public login screen for Google OAuth2 SSO.
 * Local email/password fields are placeholders for a future non-SSO flow; submitting the form starts SSO.
 *
 * @features
 * - Form validation with react-hook-form + zod (placeholders kept for UX parity).
 * - Google SSO button that redirects to backend OAuth2 endpoint.
 * - Error banner if `?error=` is present (e.g., user canceled consent).
 * - Responsive, enterprise-grade layout with MUI; accessible labels and focus handling.
 *
 * @i18n
 * - Uses react-i18next ('auth' namespace). See /public/locales for JSON files.
 * - Keys used: signIn, welcome, email, password, or, signInGoogle, ssoHint, errorTitle, errorTryAgain.
 */

import {
  Box, Card, CardContent, CardHeader, TextField, Stack,
  Button, Divider, Typography, InputAdornment, Alert
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { API_BASE } from '../../api/httpClient';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type FormValues = z.infer<typeof schema>;

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
  const { t } = useTranslation('auth');
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const oauthError = params.get('error');

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  // Local login not implemented → go to SSO
  const onSubmit = async () => beginSso();

  return (
    <Box sx={{ minHeight: 'calc(100dvh - 64px)', display: 'grid', placeItems: 'center', px: 2 }}>
      <Card sx={{ width: 480, maxWidth: '94vw' }}>
        <CardHeader title={t('signIn')} subheader={t('welcome')} />
        <CardContent>
          {/* OAuth error banner (e.g., user cancelled at Google) */}
          {oauthError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <strong>{t('errorTitle')}</strong>
            </Alert>
          )}

          <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label={t('email')}
              autoComplete="email"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              error={!!errors.email}
              helperText={errors.email?.message}
              {...register('email')}
            />
            <TextField
              label={t('password')}
              type="password"
              autoComplete="current-password"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password')}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              aria-label={t('signIn')}
            >
              {t('signIn')}
            </Button>

            <Divider>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('or')}
              </Typography>
            </Divider>

            <Button
              type="button"
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={beginSso}
              aria-label={t('signInGoogle')}
            >
              {t('signInGoogle')}
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
