/**
 * @file Filters.tsx
 * @module pages/analytics/components/filters/Filters
 *
 * @summary
 * Analytics filter panel — orchestrates the date range picker and the
 * supplier dropdown into a single controlled component.
 *
 * @enterprise
 * - Parent owns filter state; this component is fully controlled via
 *   `value` / `onChange` so URL-sync logic lives in the page, not here.
 * - Reset returns to the 180-day window and clears the supplier selection
 *   (180 mirrors the default initial state used by `Analytics.tsx`).
 * - Layout stacks vertically on mobile and side-by-side on desktop so the
 *   supplier dropdown does not push the preset row off-screen on phones.
 */

import { Stack, Paper, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DateRangeFilter } from './DateRangeFilter';
import { SupplierFilter } from './SupplierFilter';
import type { FiltersProps, AnalyticsFilters } from './Filters.types';
import { getQuickDateRange, formatToIsoDate } from './useFiltersLogic';

/**
 * Filters - Main filter panel for analytics page
 *
 * Manages:
 * - Date range selection (quick presets + custom)
 * - Supplier filtering
 *
 * @example
 * ```tsx
 * <Filters
 *   value={filters}
 *   suppliers={suppliersList}
 *   onChange={setFilters}
 *   disabled={isLoading}
 * />
 * ```
 */
export function Filters({
  value,
  suppliers,
  onChange,
  disabled = false,
}: FiltersProps) {
  const { t } = useTranslation(['analytics']);
  
  const resetFilters = () => {
    const { from, to } = getQuickDateRange(180);
    onChange({
      ...value,
      quick: '180',
      from: formatToIsoDate(from),
      to: formatToIsoDate(to),
      supplierId: undefined,
    });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, md: 2 },
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={1}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {t('analytics:filters.title', 'Filters')}
        </Typography>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 1.5, md: 2 }}
          alignItems={{ xs: 'stretch', md: 'flex-start' }}
        >
          <Box sx={{ flex: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 500 }}>
              {t('analytics:filters.dateRangeLabel', 'Date Range')}
            </Typography>
            <DateRangeFilter value={value} onChange={onChange} disabled={disabled} onReset={resetFilters} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 240 }}>
            <SupplierFilter
              value={value}
              suppliers={suppliers}
              onChange={onChange}
              disabled={disabled}
            />
          </Box>
        </Stack>
      </Stack>
    </Paper>
  );
}

export type { AnalyticsFilters, FiltersProps };
