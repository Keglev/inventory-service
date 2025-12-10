/**
 * @file PriceTrendCard.tsx
 * @module pages/analytics/blocks/price-trend
 *
 * @description
 * Price trend card with item search and price line chart (A3).
 * Supports global or supplier-scoped item searches.
 * Chart fetches only after explicit item selection.
 *
 * @remarks
 * - Enforces supplier scoping: prevents cross-supplier selections
 * - Debounced search (250ms) to avoid flooding server
 * - Keeps previous data during refetch for smooth UX
 * - Resets on supplier change to prevent data leaks
 *
 * @i18n
 * Uses 'analytics' namespace for all translation keys
 */

import * as React from 'react';
import { Card, CardContent, Typography, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getPriceTrend, type ItemRef, type PricePoint } from '../../../../api/analytics';
import { useSettings } from '../../../../hooks/useSettings';
import { ItemAutocomplete } from './ItemAutocomplete';
import { PriceChart } from './PriceChart';
import type { PriceTrendCardProps } from './PriceTrendCard.types';

/**
 * Price trend card component
 * Shows item price movement over selected date range and supplier
 *
 * @example
 * ```tsx
 * <PriceTrendCard from="2025-01-01" to="2025-12-31" supplierId="sup-123" />
 * ```
 */
export default function PriceTrendCard({
  from,
  to,
  supplierId,
}: PriceTrendCardProps) {
  const { t } = useTranslation(['analytics']);
  const { userPreferences } = useSettings();

  // Item selection state
  const [selectedItem, setSelectedItem] = React.useState<ItemRef | null>(null);
  const selectedItemId = selectedItem?.id ?? '';

  // Reset on supplier change to prevent cross-supplier leaks
  React.useEffect(() => {
    setSelectedItem(null);
  }, [supplierId]);

  // Fetch price trend data only after item selection
  const priceQ = useQuery<PricePoint[]>({
    queryKey: ['analytics', 'priceTrend', selectedItemId, from, to],
    queryFn: () => getPriceTrend(selectedItemId, { from, to, supplierId: supplierId ?? undefined }),
    enabled: !!selectedItemId,
  });

  return (
    <Card>
      <CardContent>
        {/* Header with title and item search */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle1">
            {t('analytics:cards.priceTrend')}
          </Typography>

          <ItemAutocomplete
            value={selectedItem}
            onChange={setSelectedItem}
            supplierId={supplierId}
          />
        </Stack>

        {/* Price trend chart */}
        <PriceChart
          data={priceQ.data ?? []}
          isLoading={!selectedItemId || priceQ.isLoading}
          dateFormat={userPreferences.dateFormat}
          numberFormat={userPreferences.numberFormat}
        />
      </CardContent>
    </Card>
  );
}
