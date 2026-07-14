/**
 * @file HowItWorks.tsx
 * @module pages/home/sections/HowItWorks
 *
 * @summary
 * Three-step orientation block on the public landing page: enter, record, read.
 *
 * @enterprise
 * - Step numbering is derived from the array index rather than stored in the
 *   translations, so reordering the steps never desynchronises the numerals from
 *   the copy across two locales.
 * - Purely presentational: no props, no state, no navigation.
 *
 * @i18n
 * Uses the 'landing' namespace, 'how.steps.*' subtree.
 */

import * as React from 'react';
import { Avatar, Box, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const STEPS = [
  { id: 'one', titleKey: 'how.steps.one.title', bodyKey: 'how.steps.one.body' },
  { id: 'two', titleKey: 'how.steps.two.title', bodyKey: 'how.steps.two.body' },
  { id: 'three', titleKey: 'how.steps.three.title', bodyKey: 'how.steps.three.body' },
] as const;

const HowItWorks: React.FC = () => {
  const { t } = useTranslation<'landing'>('landing');

  return (
    <Box component="section" sx={{ py: { xs: 5, md: 8 } }}>
      <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 4, textAlign: { xs: 'left', md: 'center' } }}>
        {t('how.title')}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: { xs: 3, md: 5 },
        }}
      >
        {STEPS.map(({ id, titleKey, bodyKey }, index) => (
          <Stack key={id} spacing={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 16, fontWeight: 700 }}>
              {index + 1}
            </Avatar>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              {t(titleKey)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(bodyKey)}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
};

export default HowItWorks;
