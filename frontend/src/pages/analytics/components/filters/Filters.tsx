/**
 * @file Filters.tsx
 * @description
 * Main analytics filters component - orchestrates date range and supplier filters
 */

import { Stack, Paper, Typography, Button, Box } from '@mui/material';
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
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Filters
          </Typography>
          <Button variant="outlined" size="small" onClick={resetFilters} disabled={disabled}>
            Reset
          </Button>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'flex-end' }}
        >
          <Box sx={{ flex: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Date Range
            </Typography>
            <DateRangeFilter value={value} onChange={onChange} disabled={disabled} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 220 }}>
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
