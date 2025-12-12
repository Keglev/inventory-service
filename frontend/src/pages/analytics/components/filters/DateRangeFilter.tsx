/**
 * @file DateRangeFilter.tsx
 * @description
 * Date range picker with quick presets (30/90/180 days)
 */

import { useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { formatToIsoDate, getQuickDateRange, parseIsoDate } from './useFiltersLogic';
import type { AnalyticsFilters } from './Filters.types';

interface DateRangeFilterProps {
  /** Current filter state */
  value: AnalyticsFilters;
  /** Changed on any date or quick-range change */
  onChange: (filters: AnalyticsFilters) => void;
  disabled?: boolean;
  /** Optional reset handler placed inline with presets */
  onReset?: () => void;
}

/**
 * DateRangeFilter - date picker with quick presets
 */
export function DateRangeFilter({
  value,
  onChange,
  disabled = false,
  onReset,
}: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(value.quick === 'custom');

  const fromDate = parseIsoDate(value.from);
  const toDate = parseIsoDate(value.to);

  const handleQuickRange = (days: number) => {
    const { from, to } = getQuickDateRange(days);
    onChange({
      ...value,
      quick: (days === 30 ? '30' : days === 90 ? '90' : '180') as '30' | '90' | '180',
      from: formatToIsoDate(from),
      to: formatToIsoDate(to),
    });
    setShowCustom(false);
  };

  const handleCustom = () => {
    setShowCustom(true);
    onChange({ ...value, quick: 'custom' });
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      from: e.target.value || undefined,
      quick: 'custom',
    });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...value,
      to: e.target.value || undefined,
      quick: 'custom',
    });
  };

  return (
    <Stack spacing={1} alignItems="flex-start">
      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
        <Button
          variant={value.quick === '30' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleQuickRange(30)}
          disabled={disabled}
        >
          30 days
        </Button>
        <Button
          variant={value.quick === '90' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleQuickRange(90)}
          disabled={disabled}
        >
          90 days
        </Button>
        <Button
          variant={value.quick === '180' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleQuickRange(180)}
          disabled={disabled}
        >
          180 days
        </Button>
        <Button
          variant={value.quick === 'custom' ? 'contained' : 'outlined'}
          size="small"
          onClick={handleCustom}
          disabled={disabled}
        >
          Custom
        </Button>
        {onReset && (
          <Button
            variant="outlined"
            size="small"
            onClick={onReset}
            disabled={disabled}
            sx={{ ml: { xs: 0, sm: 0.5 } }}
          >
            Reset
          </Button>
        )}
      </Stack>

      {showCustom && (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            label="From"
            type="date"
            value={fromDate?.toISOString().split('T')[0] || ''}
            onChange={handleFromChange}
            disabled={disabled}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
          <Typography variant="body2" color="text.secondary">
            to
          </Typography>
          <TextField
            label="To"
            type="date"
            value={toDate?.toISOString().split('T')[0] || ''}
            onChange={handleToChange}
            disabled={disabled}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 160 }}
          />
        </Stack>
      )}
    </Stack>
  );
}
