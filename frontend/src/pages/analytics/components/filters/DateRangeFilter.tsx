/**
 * @file DateRangeFilter.tsx
 * @module pages/analytics/components/filters/DateRangeFilter
 *
 * @summary
 * Date range picker for the analytics filter panel. Offers 30/90/180-day
 * quick presets plus a custom mode with explicit from/to inputs.
 *
 * @enterprise
 * - Filter state is shaped for URL serialization: a `quick` discriminator
 *   ('30' | '90' | '180' | 'custom') plus ISO YYYY-MM-DD `from`/`to`.
 * - Any manual edit to the date inputs forces `quick` back to `'custom'`,
 *   so the highlighted preset cannot misrepresent the active range.
 * - `onReset` is rendered inline with the preset row when provided, so
 *   the panel does not need a separate reset surface on mobile.
 * - A custom range with `from` after `to` is never sent: the backend
 *   answers 400 and the charts would go empty without saying why. The
 *   inverted pair stays in the fields only, marked as an error, while the
 *   charts keep the last valid range; min/max grey out impossible days.
 */

import { useState } from 'react';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatToIsoDate, getQuickDateRange, parseIsoDate, validateDateRange } from './useFiltersLogic';
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
  const { t } = useTranslation(['analytics']);
  const [showCustom, setShowCustom] = useState(value.quick === 'custom');
  // An inverted range stays in the fields only; the charts keep the last valid one.
  const [pending, setPending] = useState<{ from?: string; to?: string } | null>(null);

  const fromIso = formatToIsoDate(parseIsoDate(pending ? pending.from : value.from));
  const toIso = formatToIsoDate(parseIsoDate(pending ? pending.to : value.to));
  const rangeInvalid = !validateDateRange(parseIsoDate(fromIso), parseIsoDate(toIso));

  const applyRange = (from?: string, to?: string) => {
    if (!validateDateRange(parseIsoDate(from), parseIsoDate(to))) {
      setPending({ from, to });
      return;
    }
    setPending(null);
    onChange({ ...value, from, to, quick: 'custom' });
  };

  const handleQuickRange = (days: number) => {
    const { from, to } = getQuickDateRange(days);
    onChange({
      ...value,
      quick: (days === 30 ? '30' : days === 90 ? '90' : '180') as '30' | '90' | '180',
      from: formatToIsoDate(from),
      to: formatToIsoDate(to),
    });
    setPending(null);
    setShowCustom(false);
  };

  const handleCustom = () => {
    setShowCustom(true);
    onChange({ ...value, quick: 'custom' });
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    applyRange(e.target.value || undefined, toIso);

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    applyRange(fromIso, e.target.value || undefined);

  return (
    <Stack spacing={1} alignItems="flex-start">
      <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
        <Button
          variant={value.quick === '30' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleQuickRange(30)}
          disabled={disabled}
        >
          {t('analytics:filters.days30')}
        </Button>
        <Button
          variant={value.quick === '90' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleQuickRange(90)}
          disabled={disabled}
        >
          {t('analytics:filters.days90')}
        </Button>
        <Button
          variant={value.quick === '180' ? 'contained' : 'outlined'}
          size="small"
          onClick={() => handleQuickRange(180)}
          disabled={disabled}
        >
          {t('analytics:filters.days180')}
        </Button>
        <Button
          variant={value.quick === 'custom' ? 'contained' : 'outlined'}
          size="small"
          onClick={handleCustom}
          disabled={disabled}
        >
          {t('analytics:filters.custom')}
        </Button>
        {onReset && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setPending(null);
              onReset();
            }}
            disabled={disabled}
            sx={{ ml: { xs: 0, sm: 0.5 } }}
          >
            {t('analytics:filters.reset')}
          </Button>
        )}
      </Stack>

      {showCustom && (
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              label={t('analytics:filters.from')}
              type="date"
              value={fromIso ?? ''}
              onChange={handleFromChange}
              disabled={disabled}
              error={rangeInvalid}
              size="small"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: toIso } }}
              sx={{ minWidth: 160 }}
            />
            {/* An en dash, not "Bis": the second field already carries that label. */}
            <Typography variant="body2" color="text.secondary">
              {'\u2013'}
            </Typography>
            <TextField
              label={t('analytics:filters.to')}
              type="date"
              value={toIso ?? ''}
              onChange={handleToChange}
              disabled={disabled}
              error={rangeInvalid}
              size="small"
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: fromIso } }}
              sx={{ minWidth: 160 }}
            />
          </Stack>
          {rangeInvalid && (
            <Typography variant="caption" color="error" role="alert">
              {t('analytics:filters.rangeInvalid')}
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}
