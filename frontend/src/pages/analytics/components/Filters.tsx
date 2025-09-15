/**
 * @file Filters.tsx
 * @description
 * Analytics global filter bar with:
 *  - Quick picks (Last 30/90/180 days)
 *  - Custom date range (from/to)
 *  - Optional supplier dropdown
 *
 * @enterprise
 * - Centralizes filter UX so all analytics blocks stay consistent.
 * - Emits a clean, serializable state suitable for URL syncing and React Query keys.
 */

import type { JSX } from 'react';
import { Stack, TextField, MenuItem, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

export type AnalyticsFilters = {
  from?: string;        // ISO yyyy-MM-dd
  to?: string;          // ISO yyyy-MM-dd
  supplierId?: string;  // string to match URLSearchParams
  quick?: '30' | '90' | '180' | 'custom';
};

export type SupplierRef = { id: string; name: string };

export type FiltersProps = {
  /** Current value (controlled by the parent) */
  value: AnalyticsFilters;
  /** Supplier options for the dropdown (id + name) */
  suppliers: SupplierRef[];
  /** Called when the user changes anything */
  onChange: (next: AnalyticsFilters) => void;
  /** Optional: disables inputs while loading */
  disabled?: boolean;
};

/**
 * Returns today's date (local) formatted as yyyy-MM-dd for <input type="date">.
 */
function todayIsoDate(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * Utility: returns YYYY-MM-DD for N days ago, local time.
 */
function daysAgoIso(n: number): string {
  return dayjs().subtract(n, 'day').format('YYYY-MM-DD');
}

export default function Filters(props: FiltersProps): JSX.Element {
  const { value, onChange, suppliers, disabled } = props;
  const { t } = useTranslation(['analytics']);

  // Local helpers -------------------------------------------------------------

  const applyQuick = (q: '30' | '90' | '180') => {
    const from = daysAgoIso(Number(q));
    const to = todayIsoDate();
    onChange({ ...value, quick: q, from, to });
  };

  const onCustomDate = (key: 'from' | 'to', v: string) => {
    const next = { ...value, [key]: v, quick: 'custom' as const };
    onChange(next);
  };

  const onSupplier = (v: string) => {
    onChange({ ...value, supplierId: v || undefined });
  };

  const clear = () => {
    onChange({});
  };

  // Render --------------------------------------------------------------------

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="flex-start"
    >
      {/* Quick picks */}
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant={value.quick === '30' ? 'contained' : 'outlined'}
          onClick={() => applyQuick('30')}
          disabled={disabled}
        >
          {t('analytics:filters.quick.30d')}
        </Button>
        <Button
          size="small"
          variant={value.quick === '90' ? 'contained' : 'outlined'}
          onClick={() => applyQuick('90')}
          disabled={disabled}
        >
          {t('analytics:filters.quick.90d')}
        </Button>
        <Button
          size="small"
          variant={value.quick === '180' ? 'contained' : 'outlined'}
          onClick={() => applyQuick('180')}
          disabled={disabled}
        >
          {t('analytics:filters.quick.180d')}
        </Button>
      </Stack>

      {/* Custom range */}
      <TextField
        type="date"
        size="small"
        label={t('analytics:filters.dateRange')}
        value={value.from || ''}
        onChange={(e) => onCustomDate('from', e.target.value)}
        disabled={disabled}
        sx={{ minWidth: 180 }}
      />
      <TextField
        type="date"
        size="small"
        label="—"
        value={value.to || ''}
        onChange={(e) => onCustomDate('to', e.target.value)}
        disabled={disabled}
        sx={{ minWidth: 140 }}
        inputProps={{ 'aria-label': 'to' }}
      />

      {/* Supplier */}
      <TextField
        select
        size="small"
        label={t('analytics:filters.supplier')}
        value={value.supplierId || ''}
        onChange={(e) => onSupplier(e.target.value)}
        disabled={disabled}
        sx={{ minWidth: 220 }}
      >
        <MenuItem value="">{t('analytics:filters.clear')}</MenuItem>
        {suppliers.map((s) => (
          <MenuItem key={s.id} value={s.id}>
            {s.name}
          </MenuItem>
        ))}
      </TextField>

      {/* Clear */}
      <Button size="small" variant="text" onClick={clear} disabled={disabled}>
        {t('analytics:filters.clear')}
      </Button>
    </Stack>
  );
}
