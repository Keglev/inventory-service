/**
 * @file StatCard.tsx
 * @module components/ui/StatCard
 * @summary Generic KPI card for dashboards: MUI Card with title, large numeric value,
 * and skeleton loading state.
 *
 * @enterprise
 * - Single production consumer: pages/dashboard/Dashboard.tsx (the three KPI cards).
 *   Doc cross-reference in api/analytics/hooks/useDashboardMetrics.ts.
 * - Caller-side i18n: title is a plain string; caller pre-translates
 *   (e.g. t('common:dashboard.kpi.totalItems')). The component itself is i18n-agnostic.
 * - Value fallback uses em-dash (U+2014, not hyphen) — visually distinguishes "no data"
 *   from a real zero. Loading state shows a skeleton sized to the value line.
 * - Compact by design (Carlos, 2026-10-12): the cards take one short row so the
 *   dashboard fits a desktop viewport without scrolling. The value is a paragraph,
 *   not a heading: a number is not a section title, and an h4 outranked the page h5.
 */
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton } from '@mui/material';

export interface StatCardProps {
  title: string;
  value: number | null | undefined;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, loading }) => {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width={64} height={32} />
        ) : (
          <Typography variant="h5" component="p" sx={{ fontWeight: 600 }} data-testid="stat-value">
            {value ?? '—'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
