/**
 * @file FinalCta.tsx
 * @module pages/home/sections/FinalCta
 *
 * @summary
 * Closing call-to-action of the public landing page; repeats the two entry
 * actions for readers who scrolled past the hero.
 *
 * @enterprise
 * - Reuses the orchestrator's handlers rather than owning its own navigation, so
 *   the demo and sign-in behaviour cannot drift between the top and bottom of the
 *   page.
 * - Rendered as a tinted panel on the theme surface tokens; no literal colours, so
 *   it inverts correctly in dark mode.
 *
 * @i18n
 * Uses the 'landing' namespace, 'finalCta' subtree.
 */

import * as React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface FinalCtaProps {
  onDemo: () => void;
  onSignIn: () => void;
}

const FinalCta: React.FC<FinalCtaProps> = ({ onDemo, onSignIn }) => {
  const { t } = useTranslation<'landing'>('landing');

  return (
    <Box
      component="section"
      sx={{
        my: { xs: 5, md: 8 },
        px: { xs: 3, md: 6 },
        py: { xs: 4, md: 6 },
        borderRadius: 2,
        bgcolor: 'action.hover',
        textAlign: 'center',
      }}
    >
      <Stack spacing={2} alignItems="center">
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          {t('finalCta.title')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
          {t('finalCta.body')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
          <Button variant="contained" size="large" onClick={onDemo}>
            {t('finalCta.primary')}
          </Button>
          <Button variant="text" size="large" onClick={onSignIn}>
            {t('finalCta.secondary')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default FinalCta;
