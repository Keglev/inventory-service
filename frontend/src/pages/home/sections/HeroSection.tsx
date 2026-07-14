/**
 * @file HeroSection.tsx
 * @module pages/home/sections/HeroSection
 *
 * @summary
 * Above-the-fold block of the public landing page: value proposition, the two
 * entry actions (demo session, Google sign-in), and a product preview panel.
 *
 * @enterprise
 * - Stateless apart from one boolean guarding the preview image: the screenshot
 *   is an optional public asset, so a missing or failed load degrades to a styled
 *   placeholder instead of a broken-image icon on a recruiter's first screen.
 * - Entry actions are injected by the Home orchestrator; this block owns no auth
 *   or navigation logic, which keeps the landing sections free of router coupling.
 * - Layout is a CSS grid expressed through sx tokens (no Grid component), so the
 *   two-column split collapses to one column below md without a breakpoint prop API.
 *
 * @i18n
 * Uses the 'landing' namespace, 'hero' subtree.
 */

import * as React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useTranslation } from 'react-i18next';

/** Optional public asset; absent in a fresh checkout until a screenshot is added. */
const PREVIEW_SRC = `${import.meta.env.BASE_URL}images/dashboard-preview.png`;

interface HeroSectionProps {
  onDemo: () => void;
  onSignIn: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onDemo, onSignIn }) => {
  const { t } = useTranslation<'landing'>('landing');
  const [previewFailed, setPreviewFailed] = React.useState(false);

  return (
    <Box
      component="section"
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: { xs: 4, md: 6 },
        alignItems: 'center',
        py: { xs: 6, md: 10 },
      }}
    >
      <Stack spacing={2.5}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1.2 }}>
          {t('hero.eyebrow')}
        </Typography>

        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
          {t('hero.title')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
          {t('hero.subtitle')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
          <Button variant="contained" size="large" onClick={onDemo}>
            {t('hero.ctaDemo')}
          </Button>
          <Button variant="outlined" size="large" startIcon={<GoogleIcon />} onClick={onSignIn}>
            {t('hero.ctaSignIn')}
          </Button>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {t('hero.note')}
        </Typography>
      </Stack>

      <Box
        sx={{
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: 3,
          overflow: 'hidden',
          minHeight: 260,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {previewFailed ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 4 }}>
            {t('hero.previewFallback')}
          </Typography>
        ) : (
          <Box
            component="img"
            src={PREVIEW_SRC}
            alt={t('hero.previewAlt')}
            onError={() => setPreviewFailed(true)}
            sx={{ width: '100%', display: 'block' }}
          />
        )}
      </Box>
    </Box>
  );
};

export default HeroSection;
