/**
 * @file AnalyticsNav.tsx
 * @module pages/analytics/components/AnalyticsNav
 *
 * @summary
 * Secondary navigation for Analytics sections (tabs). Keeps the main page focused.
 *
 * @sections
 * - overview   → Stock Value + Monthly Movement
 * - pricing    → Price Trend
 * - inventory  → Low Stock + Stock per Supplier
 *
 * @enterprise
 * - Uses route segments so deep-links work (e.g., /analytics/pricing).
 * - Minimal state: URL is the single source of truth.
 */

import * as React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type AnalyticsSection = 'overview' | 'pricing' | 'inventory';

export type AnalyticsNavProps = {
  /** Current section (parsed from the URL). */
  section: AnalyticsSection;
};

export default function AnalyticsNav({ section }: AnalyticsNavProps) {
  const navigate = useNavigate();
  const { t } = useTranslation(['analytics']);

  const handleChange = (_e: React.SyntheticEvent, next: string) => {
    navigate(`/analytics/${next}`);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}>
      <Tabs value={section} onChange={handleChange} variant="scrollable" scrollButtons="auto">
        <Tab value="overview"  label={t('analytics.nav.overview', 'Overview')} />
        <Tab value="pricing"   label={t('analytics.nav.pricing', 'Pricing')} />
        <Tab value="inventory" label={t('analytics.nav.inventory', 'Inventory health')} />
      </Tabs>
    </Box>
  );
}
