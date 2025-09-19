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

/**
 * Serializable filter state mirrored to the URL.
 * Dates are ISO `yyyy-MM-dd` (local calendar).
 * @public
 */
export type AnalyticsFilters = {
  /** Inclusive lower bound date (ISO, `yyyy-MM-dd`). */
  from?: string;
  /** Inclusive upper bound date (ISO, `yyyy-MM-dd`). */
  to?: string;
  /** Selected supplier identifier (string ID; canonical URL key is `supplierId`). */
  supplierId?: string;
  /** Quick-range selector: `'30' | '90' | '180' | 'custom'`. */
  quick?: '30' | '90' | '180' | 'custom';
};

/** Lightweight supplier reference (for dropdown options). */
export type SupplierRef = { id: string; name: string };

/**
 * Props for {@link Filters}.
 * @public
 */
export type FiltersProps = {
  /** Current value (controlled by the parent). */
  value: AnalyticsFilters;
  /** Supplier options for the dropdown (id + name). */
  suppliers: SupplierRef[];
  /** Called when the user changes anything. */
  onChange: (next: AnalyticsFilters) => void;
  /** Optional: disables inputs while loading. */
  disabled?: boolean;
};

/** @internal Returns today's date in `yyyy-MM-dd` for `<input type="date">`. */
function todayIsoDate(): string {
  return dayjs().format('YYYY-MM-DD');
}

/** @internal Returns the date `n` days ago in `yyyy-MM-dd`. */
function daysAgoIso(n: number): string {
  return dayjs().subtract(n, 'day').format('YYYY-MM-DD');
}

/**
 * Filters component.
 * @remarks
 * - Keeps state minimal and URL-friendly.
 * - Ensures supplierId is stored as a *raw* string (no quotes).
 */
export default function Filters(props: FiltersProps): JSX.Element {
  const { value, onChange, suppliers, disabled } = props;
  const { t } = useTranslation(['analytics']);

  /** Apply one of the predefined quick ranges (30/90/180 days). */
  const applyQuick = (q: '30' | '90' | '180') => {
    const from = daysAgoIso(Number(q));
    const to = todayIsoDate();
    onChange({ ...value, quick: q, from, to });
  };

  /** Update a custom date field and mark quick as 'custom'. */
  const onCustomDate = (key: 'from' | 'to', v: string) => {
    const next = { ...value, [key]: v, quick: 'custom' as const };
    onChange(next);
  };

  /**
  * Update the supplier.
  * Stores a raw, de-quoted string ID in `supplierId` (canonical URL key).
  * Passing an empty value clears the filter.
  */
  const onSupplier = (v: string) => {
    const raw = (v ?? '').replace(/^"+|"+$/g, '');
    onChange({ ...value, supplierId: raw || undefined });
  };

  /** Reset all filters. */
  const clear = () => {
    onChange({});
  };

  /**
   * Render the full filter bar.
   * - Quick picks (30/90/180 days)
   * - Custom date range (from/to)
   * - Supplier dropdown (if options provided)
   * - Clear button
   * @remarks
   * - Responsive layout: horizontal on desktop, vertical on mobile.
   * - Uses MUI components for consistency with the rest of the app.
   * - i18n support via react-i18next.
   * - Accessibility: proper labels and keyboard navigation.
   * - Disabled state support while loading.
   * - Auto-hides supplier dropdown if no suppliers provided.
   * - Ensures controlled inputs with empty strings for undefined values.
   * - Minimal inline styles; prefers MUI system props.
   * - Clear button resets all filters to default state.
   */
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

      {/* Supplier (auto-hidden if blocked/empty) */}
      {suppliers.length > 0 && (
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
      )}

      {/* Clear */}
      <Button size="small" variant="text" onClick={clear} disabled={disabled}>
        {t('analytics:filters.clear')}
      </Button>
    </Stack>
  );
}
