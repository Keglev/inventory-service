/**
 * @file LoginPage.tsx
 *
 * @description
 * - Public login screen. Uses Google OAut2 via backend. Local email/password.
 * - fields are kept as placeholders for a future non-SSO flow.
 * - On submit, redirects to backend OAuth2 endpoint.
 * 
 * @features
 * - Form validation with react-hook-form + zod.
 * - Google SSO button that redirects to backend OAuth2 endpoint.
 * - Responsive design with MUI components.
 * @i18n
 * - Uses react-i18next for translations. See /public/locales for JSON files.
 * - Supports multiple languages (EN, DE) via i18next.
*/
import {
  Box, Card, CardContent, CardHeader, TextField, Stack,
  Button, Divider, Typography, InputAdornment,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import { useTranslation } from 'react-i18next';
import { API_BASE } from '../../api/httpClient'; // <-- use same base as http

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type FormValues = z.infer<typeof schema>;

const SSO_URL = `${API_BASE}/oauth2/authorization/google`;

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async () => {
    // Local login not implemented → go to SSO
    window.location.href = SSO_URL;
  };

  return (
    <Box sx={{ minHeight: 'calc(100dvh - 64px)', display: 'grid', placeItems: 'center' }}>
      <Card sx={{ width: 420, maxWidth: '94vw' }}>
        <CardHeader title={t('signIn')} subheader={t('welcome')} />
        <CardContent>
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
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {t('signIn')}
            </Button>
            <Divider>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {t('ssoHint')}
              </Typography>
            </Divider>
            <Button
              type="button"
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => (window.location.href = SSO_URL)}
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
