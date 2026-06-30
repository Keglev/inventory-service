/**
 * @file PriceTrendCard.tsx
 * @module pages/analytics/blocks/PriceTrendCard
 *
 * @summary
 * Supplier-aware item typeahead + price trend line chart (A3). User
 * picks an item from the typeahead; the chart fetches and renders
 * only after an explicit selection.
 *
 * @enterprise
 * - Cross-supplier leak prevention is double-locked: (a) selection and
 *   query text reset whenever the supplier prop changes; (b) the
 *   client filters options by supplier even if the backend returns
 *   cross-supplier results. Belt-and-suspenders by design.
 * - The typeahead is debounced at 250 ms and gated by `enabled`, so
 *   requests do not fire on every keystroke.
 * - The chart query is enabled only after an explicit item selection;
 *   typing alone never triggers a price-trend fetch.
 * - The selected item is held as an object (not just an id) so it
 *   stays visible in the Autocomplete even when a refetch reshuffles
 *   the options list.
 * - If supplier-scoped search is unsupported server-side, options
 *   stay empty rather than silently downgrading to a global search;
 *   the helperText messages the situation clearly to the user.
 */

import * as React from 'react';
import { Card, CardContent, Typography, Skeleton, Box, TextField, Stack } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import type { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  getPriceTrend,
  type PricePoint,
} from '../../../api/analytics';
import { searchItemsForSupplier, searchItemsGlobal, type ItemRef } from '@/api/shared';
import { useDebounced } from '../../../hooks/useDebounced';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { useSettings } from '../../../hooks/useSettings';
import { formatDate, formatNumber } from '../../../utils/formatters';

export type PriceTrendCardProps = { from?: string; to?: string; supplierId?: string | null };

/**
 * Local narrow type (ItemRef already includes optional supplierId).
 * Kept to document intent: UI enforces supplier scoping even if BE ignores it.
 */
type ItemWithSupplier = ItemRef & { supplierId?: string | null };

export default function PriceTrendCard({ from, to, supplierId }: PriceTrendCardProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();
  const { userPreferences } = useSettings();
  const formatDateLabel = React.useCallback(
    (value: string | number) => {
      const str = String(value);
      const formatted = formatDate(str, userPreferences.dateFormat);
      return formatted || str;
    },
    [userPreferences.dateFormat]
  );

  // ---------------------------------------------------------------------------
  // Type-ahead state (stable selection + debounced query)
  // ---------------------------------------------------------------------------

  /** Controlled input text inside the Autocomplete. */
  const [itemQuery, setItemQuery] = React.useState('');
  /** Debounce to avoid flooding the server while typing. */
  const debouncedQuery = useDebounced(itemQuery, 250);
  /** Keep the selected item as an object — DO NOT derive from options. */
  const [selectedItem, setSelectedItem] = React.useState<ItemRef | null>(null);
  const selectedItemId = selectedItem?.id ?? '';

  /** Reset text + selection when supplier changes (prevents cross-supplier leaks). */
  React.useEffect(() => {
    setItemQuery('');
    setSelectedItem(null);
  }, [supplierId]);

  // ---------------------------------------------------------------------------
  // Search (global vs supplier-scoped) — keep previous options during refetch
  // ---------------------------------------------------------------------------

  const itemSearchQ = useQuery<ItemRef[]>({
    queryKey: ['analytics', 'itemSearch', supplierId ?? null, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      if (supplierId) return searchItemsForSupplier(supplierId, debouncedQuery, 50);
      return searchItemsGlobal(debouncedQuery, 50);
    },
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
    // v5 replacement for keepPreviousData: true
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  /**
   * Final options:
   *  - Start from async results.
   *  - If supplierId is set → filter by supplier on the client as well.
   *  - Apply text narrowing too (belt-and-suspenders).
   */
  const baseOptions: ItemWithSupplier[] = React.useMemo(() => {
    const base = (itemSearchQ.data ?? []) as ItemWithSupplier[];
    const sid = supplierId ?? '';
    const q = debouncedQuery.trim().toLowerCase();
    const bySupplier = sid ? base.filter((it) => (it.supplierId ?? '') === sid) : base;
    const byQuery = q ? bySupplier.filter((it) => it.name.toLowerCase().includes(q)) : bySupplier;
    return byQuery.slice(0, 50);
  }, [itemSearchQ.data, supplierId, debouncedQuery]);

  /**
   * Keep the selected item visible even while refetching:
   * if the current options don't include it (transiently), union it back.
   */
  const options: ItemWithSupplier[] = React.useMemo(() => {
    if (selectedItem && !baseOptions.some((o) => o.id === selectedItem.id)) {
      return [selectedItem as ItemWithSupplier, ...baseOptions];
    }
    return baseOptions;
  }, [baseOptions, selectedItem]);

  // ---------------------------------------------------------------------------
  // Price trend series — fetched only after explicit selection
  // ---------------------------------------------------------------------------

  const priceQ = useQuery<PricePoint[]>({
    queryKey: ['analytics', 'priceTrend', selectedItemId, from, to],
    queryFn: () => getPriceTrend(selectedItemId, { from, to, supplierId: supplierId ?? undefined }),
    enabled: !!selectedItemId,
  });

  const priceData = React.useMemo(
    () => [...(priceQ.data ?? [])].sort((a, b) => (a?.date ?? '').localeCompare(b?.date ?? '')),
    [priceQ.data]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle1">{t('analytics:cards.priceTrend')}</Typography>

          <Autocomplete<ItemRef, false, false, false>
            sx={{ minWidth: 320 }}
            options={options}
            getOptionLabel={(o) => o.name}
            loading={itemSearchQ.isLoading}
            /** Keep selection stable; don't derive it from options */
            value={selectedItem}
            onChange={(_e, val) => {
              setSelectedItem(val);
              // Optional UX: mirror selection text so search stays in sync
              if (val) setItemQuery(val.name);
            }}
            /** Controlled input text (what the user types) */
            inputValue={itemQuery}
            onInputChange={(_e, val) => setItemQuery(val)}
            /** Search UX */
            forcePopupIcon={false}
            clearOnBlur={false}
            selectOnFocus
            handleHomeEndKeys
            /** We already filtered; don't let MUI filter again */
            filterOptions={(x) => x}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderInput={(params: AutocompleteRenderInputParams) => {
              const typed = debouncedQuery.trim().length > 0;
              const showNoMatches = !!supplierId && typed && options.length === 0;
              const showTypeHint = !!supplierId && !typed;
              return (
                <TextField
                  {...params}
                  size="small"
                  label={t('analytics:item')}
                  placeholder={t('analytics:priceTrend.selectSupplierShort')}
                  helperText={
                    showNoMatches
                      ? t('analytics:priceTrend.noItemsForSupplier')
                      : showTypeHint
                      ? t('analytics:priceTrend.typeToSearch', 'Start typing to search…')
                      : ' '
                  }
                  FormHelperTextProps={{ sx: { minHeight: 20, mt: 0.5 } }}
                />
              );
            }}
            noOptionsText={
              debouncedQuery
                ? t('analytics:priceTrend.noItemsForSupplier')
                : t('analytics:priceTrend.selectSupplierShort')
            }
          />
        </Stack>

        {!selectedItemId || priceQ.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : priceData.length === 0 ? (
          <Box sx={{ height: 220, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
            {t('analytics:cards.noData')}
          </Box>
        ) : (
          <Box sx={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => formatNumber(Number(value), userPreferences.numberFormat, 2)}
                />
                <Tooltip
                  labelFormatter={(value) => formatDateLabel(value as string)}
                  formatter={(value: number | string) =>
                    typeof value === 'number'
                      ? formatNumber(value, userPreferences.numberFormat, 2)
                      : value
                  }
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={muiTheme.palette.primary.main}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
