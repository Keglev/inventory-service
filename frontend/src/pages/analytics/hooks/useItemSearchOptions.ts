/**
 * @file useItemSearchOptions.ts
 * @module pages/analytics/hooks/useItemSearchOptions
 * @summary Shared debounced item-autocomplete state and search query for analytics pickers.
 * @enterprise
 * Deduplicates the type-ahead pattern previously copied in PriceTrendCard and
 * MovementsSection: controlled input text, 250ms debounce, object-based
 * selection (never derived from options), reset on supplier change to prevent
 * cross-supplier leaks, and a supplier-scoped-vs-global server search. Callers
 * keep their own option-list enrichment (labels, selected-item pinning) local,
 * because that presentation logic differs per consumer. Behavior knobs that
 * differ between consumers (minimum characters, previous-data placeholder,
 * query-key scope) are explicit parameters so each call site preserves its
 * original semantics exactly.
 */
import * as React from 'react';
import { useQuery, keepPreviousData, type UseQueryResult } from '@tanstack/react-query';
import { searchItemsForSupplier, searchItemsGlobal } from '../../../api/shared/itemSearch';
import type { ItemRef } from '../../../api/shared/types';
import { useDebounced } from '../../../hooks/useDebounced';

export type UseItemSearchOptionsParams = {
  /** Current supplier filter; null/undefined searches globally. */
  supplierId?: string | null;
  /** Minimum trimmed input length before the server is queried. */
  minChars: number;
  /** Keep previous options visible during refetch (TanStack placeholderData). */
  keepPrevious?: boolean;
  /** Distinct query-key scope per consumer so caches never collide. */
  queryKeyScope: string;
};

export type UseItemSearchOptionsResult = {
  itemQuery: string;
  setItemQuery: React.Dispatch<React.SetStateAction<string>>;
  debouncedQuery: string;
  selectedItem: ItemRef | null;
  setSelectedItem: React.Dispatch<React.SetStateAction<ItemRef | null>>;
  searchQuery: UseQueryResult<ItemRef[]>;
};

export function useItemSearchOptions({
  supplierId,
  minChars,
  keepPrevious = false,
  queryKeyScope,
}: UseItemSearchOptionsParams): UseItemSearchOptionsResult {
  const [itemQuery, setItemQuery] = React.useState('');
  const debouncedQuery = useDebounced(itemQuery, 250);
  const [selectedItem, setSelectedItem] = React.useState<ItemRef | null>(null);

  // Reset text + selection when supplier changes (prevents cross-supplier leaks).
  React.useEffect(() => {
    setItemQuery('');
    setSelectedItem(null);
  }, [supplierId]);

  const searchQuery = useQuery<ItemRef[]>({
    queryKey: ['analytics', queryKeyScope, supplierId ?? null, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      if (supplierId) return searchItemsForSupplier(supplierId, debouncedQuery, 50);
      return searchItemsGlobal(debouncedQuery, 50);
    },
    enabled: debouncedQuery.trim().length >= minChars,
    staleTime: 30_000,
    ...(keepPrevious ? { placeholderData: keepPreviousData } : {}),
    refetchOnWindowFocus: false,
  });

  return { itemQuery, setItemQuery, debouncedQuery, selectedItem, setSelectedItem, searchQuery };
}
