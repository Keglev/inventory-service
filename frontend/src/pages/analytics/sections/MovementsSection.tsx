/**
 * @file MovementsSection.tsx
 * @module pages/analytics/sections/MovementsSection
 *
 * @summary
 * "Movements" analytics section: per-reason stock movement with increases on
 * the LEFT chart and decreases on the RIGHT chart, plus a row-level drilldown
 * table underneath. Consumes the page-global filters (window + supplier) and
 * adds two section-local controls:
 * - item-name filter (debounced, sent to the backend),
 * - reason multi-select chips (client-side; the endpoint always returns the
 *   full reason set, so toggling never refetches).
 *
 * @enterprise
 * - Quantities are sign-split by the backend, so a reason (e.g. MANUAL_UPDATE)
 *   can legitimately appear on both charts at once.
 * - An empty chip selection means "all reasons" — one tap less for the common
 *   case and no dead state.
 *
 * Size note: after extracting the shared item-search hook, the remainder is
 * the reason filter and chart render body; accepted above the typical range,
 * under the alarm threshold.
 */
import * as React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getReasonBreakdown, type ReasonBreakdownRow } from '../../../api/analytics/reasonBreakdown';
import type { ItemRef } from '../../../api/shared/types';
import { useItemSearchOptions } from '../hooks/useItemSearchOptions';
import { ItemSearchAutocomplete } from '../components/ItemSearchAutocomplete';
import ReasonBreakdownChartCard, { type ReasonBreakdownDatum } from './ReasonBreakdownChartCard';
import MovementDrilldownTable from './MovementDrilldownTable';
import { STOCK_CHANGE_REASONS, reasonLabel, type StockChangeReasonKey } from './reasonLabels';

export type MovementsSectionProps = {
  from?: string;
  to?: string;
  supplierId?: string | null;
};

const ITEM_SEARCH_MIN_CHARS = 2;

export default function MovementsSection({ from, to, supplierId }: MovementsSectionProps) {
  const { t } = useTranslation(['analytics']);
  const muiTheme = useMuiTheme();

  // Item filter is SELECTION-based (matches the app's other item pickers):
  // the user types >= 2 letters, gets real item-name suggestions, and only an
  // explicit selection filters the charts and drilldown. This avoids silent
  // no-match filtering from free text that isn't a name substring.
  // Shared analytics type-ahead: input, debounce, selection, reset-on-supplier,
  // and the supplier-scoped-vs-global search query (>= 2 chars).
  const {
    itemQuery,
    setItemQuery,
    debouncedQuery,
    selectedItem,
    setSelectedItem,
    searchQuery: itemSearchQ,
  } = useItemSearchOptions({ supplierId, minChars: ITEM_SEARCH_MIN_CHARS, queryKeyScope: 'movementsItemSearch' });
  const itemName = selectedItem?.name ?? '';

  /** Keep the current selection visible even when options refetch. */
  const itemOptions: ItemRef[] = React.useMemo(() => {
    const base = itemSearchQ.data ?? [];
    if (selectedItem && !base.some((o) => o.id === selectedItem.id)) {
      return [selectedItem, ...base];
    }
    return base;
  }, [itemSearchQ.data, selectedItem]);

  // Reason multi-select: empty selection = all reasons.
  const [selectedReasons, setSelectedReasons] = React.useState<StockChangeReasonKey[]>([]);
  const toggleReason = React.useCallback((reason: StockChangeReasonKey) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  }, []);

  const q = useQuery<ReasonBreakdownRow[]>({
    queryKey: ['analytics', 'reasonBreakdown', from ?? null, to ?? null, supplierId ?? null, itemName || null],
    queryFn: () =>
      getReasonBreakdown({
        from,
        to,
        supplierId: supplierId ?? undefined,
        itemName: itemName || undefined,
      }),
    staleTime: 60_000,
  });

  const { increases, decreases } = React.useMemo(() => {
    const rows = q.data ?? [];
    const visible =
      selectedReasons.length === 0
        ? rows
        : rows.filter((r) => (selectedReasons as string[]).includes(r.reason));
    const toDatum = (r: ReasonBreakdownRow, value: number): ReasonBreakdownDatum => ({
      label: reasonLabel(t, r.reason),
      value,
    });
    return {
      increases: visible.filter((r) => r.increase > 0).map((r) => toDatum(r, r.increase)),
      decreases: visible.filter((r) => r.decrease > 0).map((r) => toDatum(r, r.decrease)),
    };
  }, [q.data, selectedReasons, t]);

  // Helper line semantics are host-specific: global search from two typed
  // characters; show no-matches only once the search has settled.
  const pickerTyped = debouncedQuery.trim().length >= ITEM_SEARCH_MIN_CHARS;
  const pickerHelperText =
    pickerTyped && !itemSearchQ.isLoading && itemOptions.length === 0
      ? t('analytics:movements.noMatches')
      : !pickerTyped
      ? t('analytics:movements.typeToSearch')
      : ' ';

  return (
    <Box sx={{ gridColumn: '1 / -1', display: 'grid', gap: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
        <ItemSearchAutocomplete
          options={itemOptions}
          loading={itemSearchQ.isLoading}
          value={selectedItem}
          inputValue={itemQuery}
          onSelect={setSelectedItem}
          onInputChange={setItemQuery}
          label={t('analytics:movements.itemFilter')}
          helperText={pickerHelperText}
        />
        <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" alignItems="center">
          <Typography variant="body2" sx={{ mr: 0.5, color: 'text.secondary' }}>
            {t('analytics:movements.reasonFilter')}:
          </Typography>
          {STOCK_CHANGE_REASONS.map((reason) => (
            <Chip
              key={reason}
              size="small"
              label={reasonLabel(t, reason)}
              color={selectedReasons.includes(reason) ? 'primary' : 'default'}
              variant={selectedReasons.includes(reason) ? 'filled' : 'outlined'}
              onClick={() => toggleReason(reason)}
            />
          ))}
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          alignItems: 'stretch',
        }}
      >
        <ReasonBreakdownChartCard
          title={t('analytics:movements.increasesTitle')}
          data={increases}
          color={muiTheme.palette.success.main}
          loading={q.isLoading}
        />
        <ReasonBreakdownChartCard
          title={t('analytics:movements.decreasesTitle')}
          data={decreases}
          color={muiTheme.palette.error.main}
          loading={q.isLoading}
        />
      </Box>

      <MovementDrilldownTable from={from} to={to} supplierId={supplierId} itemName={itemName} />
    </Box>
  );
}
