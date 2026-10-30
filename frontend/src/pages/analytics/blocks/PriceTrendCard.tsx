/**
 * @file PriceTrendCard.tsx
 * @module pages/analytics/blocks/PriceTrendCard
 *
 * @summary
 * Supplier-aware item typeahead + price trend card (A3). User picks an
 * item by name or code from the typeahead; the chart (PriceTrendChart)
 * fetches and renders only after an explicit selection.
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
import { Card, CardContent, Typography, Skeleton, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getPriceTrend } from '../../../api/analytics/priceTrend';
import type { PricePoint } from '../../../api/analytics/types';
import type { ItemRef } from '../../../api/shared/types';
import { useItemSearchOptions } from '../hooks/useItemSearchOptions';
import { ItemSearchAutocomplete } from '../components/ItemSearchAutocomplete';
import { toStepSeries } from '../../../utils/stepSeries';
import PriceTrendChart from './PriceTrendChart';
import { ChartPlaceholder } from '../components/ChartCard';

export type PriceTrendCardProps = { from?: string; to?: string; supplierId?: string | null };

/**
 * Local narrow type (ItemRef already includes optional supplierId).
 * Kept to document intent: UI enforces supplier scoping even if BE ignores it.
 */
type ItemWithSupplier = ItemRef & { supplierId?: string | null };

export default function PriceTrendCard({ from, to, supplierId }: PriceTrendCardProps) {
  const { t } = useTranslation(['analytics']);

  // ---------------------------------------------------------------------------
  // Type-ahead state (stable selection + debounced query)
  // ---------------------------------------------------------------------------

  // Type-ahead state + supplier-scoped search live in the shared analytics hook;
  // this card keeps only its option enrichment (supplier filter + text narrowing).
  const {
    itemQuery,
    setItemQuery,
    debouncedQuery,
    selectedItem,
    setSelectedItem,
    searchQuery: itemSearchQ,
  } = useItemSearchOptions({ supplierId, minChars: 1, keepPrevious: true, queryKeyScope: 'itemSearch' });
  const selectedItemId = selectedItem?.id ?? '';

  /**
   * Final options:
   *  - Start from async results.
   *  - If supplierId is set -> filter by supplier on the client as well.
   *  - Apply text narrowing too (belt-and-suspenders).
   */
  const baseOptions: ItemWithSupplier[] = React.useMemo(() => {
    const base = (itemSearchQ.data ?? []) as ItemWithSupplier[];
    const sid = supplierId ?? '';
    const q = debouncedQuery.trim().toLowerCase();
    const bySupplier = sid ? base.filter((it) => (it.supplierId ?? '') === sid) : base;
    // The server matches name OR code; narrowing by name alone dropped every
    // code hit. Narrowing stays because keepPrevious shows the last query's
    // results while the next one loads.
    const byQuery = q
      ? bySupplier.filter((it) => it.name.toLowerCase().includes(q) || (it.sku ?? '').toLowerCase().includes(q))
      : bySupplier;
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

  const priceData = React.useMemo(() => toStepSeries(priceQ.data, to), [priceQ.data, to]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Helper line semantics are host-specific: only meaningful with a supplier
  // selected (this card searches within the chosen supplier's items).
  const pickerTyped = debouncedQuery.trim().length > 0;
  const pickerHelperText =
    supplierId && pickerTyped && options.length === 0
      ? t('analytics:priceTrend.noItemsForSupplier')
      : supplierId && !pickerTyped
      ? t('analytics:priceTrend.typeToSearch')
      : ' ';

  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="subtitle1">{t('analytics:cards.priceTrend')}</Typography>

          <ItemSearchAutocomplete
            minWidth={320}
            options={options}
            loading={itemSearchQ.isLoading}
            value={selectedItem}
            inputValue={itemQuery}
            onSelect={setSelectedItem}
            onInputChange={setItemQuery}
            label={t('analytics:item')}
            placeholder={t('analytics:priceTrend.itemPlaceholder')}
            helperText={pickerHelperText}
            noOptionsText={
              !debouncedQuery
                ? t('analytics:priceTrend.typeToSearch')
                : supplierId
                ? t('analytics:priceTrend.noItemsForSupplier')
                : t('analytics:priceTrend.noItems')
            }
          />
        </Stack>

        {!selectedItemId ? (
          <ChartPlaceholder>{t('analytics:priceTrend.selectItem')}</ChartPlaceholder>
        ) : priceQ.isLoading ? (
          <Skeleton variant="rounded" height={220} />
        ) : priceData.length === 0 ? (
          <ChartPlaceholder>{t('analytics:cards.noData')}</ChartPlaceholder>
        ) : (
          <PriceTrendChart series={priceData} from={from} to={to} />
        )}
      </CardContent>
    </Card>
  );
}
