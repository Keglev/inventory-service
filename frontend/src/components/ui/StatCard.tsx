/**
 * @file StatCard.tsx
 * @description
 * Generic KPI/stat card for dashboards with a large value, subtitle, and loading state.
 *
 * @usage
 * <StatCard title={t('common:dashboard.kpi.totalItems')} value={count} loading={isLoading} />
 * @enterprise
 * - Reusable component for consistent KPI display
 * - Built-in loading state with skeleton
 * - Handles null/undefined values gracefully
 * - Uses MUI Card for consistent styling
 */
import * as React from 'react';
import { Card, CardContent, Typography, Skeleton } from '@mui/material';

// Props for the StatCard component
export interface StatCardProps {
  title: string;
  value: number | null | undefined;
  loading?: boolean;
}

// StatCard component definition
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
