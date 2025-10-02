/**
 * @file useItemSearch.ts
 * @module pages/inventory/hooks/useItemSearch
 *
 * @summary
 * Reusable hook for supplier-scoped item search with debouncing.
 * Implements the same pattern as PriceTrendCard for consistent UX.
 *
 * @features
 * - Supplier-scoped search with automatic state reset
 * - Debounced queries to prevent API flooding
 * - Proper state management for selected items
 * - Resilient error handling and fallbacks
 * - Enhanced item data with quantity and price information
 */

import * as React from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useDebounced } from '../../analytics/hooks/useDebounced';
import { searchItemsWithDetails } from '../api/enhancedItemSearch';
import type { DisplayableItem } from '../components/ItemAutocompleteOption';

export interface UseItemSearchProps {
  /** Currently selected supplier ID */
  supplierId?: string | null;
  /** Maximum number of results to return */
  limit?: number;
  /** Minimum query length before search starts */
  minQueryLength?: number;
  /** Debounce delay in milliseconds */
  debounceDelay?: number;
}

export interface UseItemSearchReturn {
  /** Current search query text */
  itemQuery: string;
  /** Set the search query text */
  setItemQuery: (query: string) => void;
  /** Currently selected item */
  selectedItem: DisplayableItem | null;
  /** Set the selected item */
  setSelectedItem: (item: DisplayableItem | null) => void;
  /** Available search options */
  itemOptions: DisplayableItem[];
  /** Whether search is loading */
  isSearchLoading: boolean;
  /** Whether search has error */
  isSearchError: boolean;
  /** Reset all search state */
  resetSearch: () => void;
}

/**
 * Hook for supplier-scoped item search functionality.
 * Automatically resets state when supplier changes.
 */
export function useItemSearch(props: UseItemSearchProps = {}): UseItemSearchReturn {
  const {
    supplierId,
    limit = 50,
    minQueryLength = 1,
    debounceDelay = 250,
  } = props;

  // ================================
  // Search State Management
  // ================================

  /** Autocomplete search state for item selection */
  const [itemQuery, setItemQuery] = React.useState('');
  /** Debounced search query to prevent excessive API calls */
  const debouncedItemQuery = useDebounced(itemQuery, debounceDelay);
  /** Currently selected item for operations */
  const [selectedItem, setSelectedItem] = React.useState<DisplayableItem | null>(null);

  /** Reset search state when supplier changes (prevents cross-supplier leaks) */
  React.useEffect(() => {
    setItemQuery('');
    setSelectedItem(null);
  }, [supplierId]);

  // ================================
  // Item Search Query
  // ================================

  /** Search items for the selected supplier with debounced query */
  const itemSearchQuery = useQuery<DisplayableItem[]>({
    queryKey: ['itemSearch', supplierId ?? null, debouncedItemQuery],
    queryFn: async () => {
      if (!supplierId || !debouncedItemQuery.trim() || debouncedItemQuery.trim().length < minQueryLength) {
        return [];
      }
      return searchItemsWithDetails(String(supplierId), debouncedItemQuery, limit);
    },
    enabled: !!supplierId && debouncedItemQuery.trim().length >= minQueryLength,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  /**
   * Final options with supplier filtering and selected item preservation.
   * Ensures selected item remains visible even during refetch.
   */
  const itemOptions = React.useMemo(() => {
    const baseOptions = itemSearchQuery.data ?? [];
    
    // Additional client-side filtering by supplier (belt-and-suspenders approach)
    const filteredOptions = supplierId
      ? baseOptions.filter((option) => (option.supplierId ?? '') === supplierId)
      : baseOptions;
    
    // Ensure selected item remains visible even during refetch
    if (selectedItem && !filteredOptions.some((option) => option.id === selectedItem.id)) {
      return [selectedItem, ...filteredOptions];
    }
    
    return filteredOptions;
  }, [itemSearchQuery.data, selectedItem, supplierId]);

  // ================================
  // Reset Function
  // ================================

  const resetSearch = React.useCallback(() => {
    setItemQuery('');
    setSelectedItem(null);
  }, []);

  return {
    itemQuery,
    setItemQuery,
    selectedItem,
    setSelectedItem,
    itemOptions,
    isSearchLoading: itemSearchQuery.isLoading,
    isSearchError: itemSearchQuery.isError,
    resetSearch,
  };
}