/**
 * @file FeatureGrid.tsx
 * @module pages/home/sections/FeatureGrid
 *
 * @summary
 * Six-card capability grid on the public landing page: inventory, suppliers,
 * financial analytics, audit trail, access control, and bilingual UI.
 *
 * @enterprise
 * - The card list is a module-level constant of i18n key stems paired with an
 *   icon, so copy changes stay in the JSON files and never touch this component.
 * - Icons are decorative and hidden from assistive technology; the card title
 *   carries the meaning, so no icon needs an accessible name.
 * - Purely presentational: no data fetching, no props, no state.
 *
 * @i18n
 * Uses the 'landing' namespace, 'features.items.*' subtree.
 */

import * as React from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';

import { useTranslation } from 'react-i18next';

// WHY: literal key strings (not template interpolation) so the i18n key typing
// from resources.d.ts still validates every card at compile time.
const FEATURES = [
  { id: 'inventory', Icon: Inventory2OutlinedIcon, titleKey: 'features.items.inventory.title', bodyKey: 'features.items.inventory.body' },
  { id: 'suppliers', Icon: LocalShippingOutlinedIcon, titleKey: 'features.items.suppliers.title', bodyKey: 'features.items.suppliers.body' },
  { id: 'finance', Icon: InsightsOutlinedIcon, titleKey: 'features.items.finance.title', bodyKey: 'features.items.finance.body' },
  { id: 'history', Icon: HistoryOutlinedIcon, titleKey: 'features.items.history.title', bodyKey: 'features.items.history.body' },
  { id: 'access', Icon: ShieldOutlinedIcon, titleKey: 'features.items.access.title', bodyKey: 'features.items.access.body' },
  { id: 'i18n', Icon: TranslateOutlinedIcon, titleKey: 'features.items.i18n.title', bodyKey: 'features.items.i18n.body' },
] as const;

const FeatureGrid: React.FC = () => {
  const { t } = useTranslation<'landing'>('landing');

  return (
    <Box component="section" sx={{ py: { xs: 5, md: 8 } }}>
      <Stack spacing={1} sx={{ mb: 4, textAlign: { xs: 'left', md: 'center' } }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
          {t('features.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('features.subtitle')}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' },
          gap: 2.5,
        }}
      >
        {FEATURES.map(({ id, Icon, titleKey, bodyKey }) => (
          <Card key={id} variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Icon color="primary" aria-hidden fontSize="medium" />
              <Typography variant="h6" component="h3" sx={{ mt: 1, fontWeight: 600 }}>
                {t(titleKey)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t(bodyKey)}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default FeatureGrid;
