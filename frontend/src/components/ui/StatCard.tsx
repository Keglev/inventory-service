/**
 * @file StatCard.tsx
 * @module components/ui/StatCard
 * @summary Generic KPI card for dashboards: MUI Card with title, large numeric value,
 * and skeleton loading state.
 *
 * @enterprise
 * - Single production consumer: pages/dashboard/Dashboard.tsx (three KPI cards on
 *   lines 87/94/101). Doc cross-reference in api/analytics/hooks/useDashboardMetrics.ts.
 * - Caller-side i18n: title is a plain string; caller pre-translates
 *   (e.g. t('common:dashboard.kpi.totalItems')). The component itself is i18n-agnostic.
 * - Value fallback uses em-dash (U+2014, not hyphen) — visually distinguishes "no data"
 *   from a real zero. Loading state shows a skeleton sized to the h4 Typography slot.
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
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width={80} height={40} />
        ) : (
          <Typography variant="h4" data-testid="stat-value">
            {value ?? '—'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
