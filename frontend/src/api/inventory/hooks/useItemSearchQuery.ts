/**
 * @module api/inventory/hooks/useItemSearchQuery
 *
 * Item picker data for the inventory dialogs (quantity, price, edit,
 * delete). Once a supplier is chosen, its items load once and every
 * keystroke is matched in the browser (frontend ADR-0014).
 */

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listItemsForSupplier, searchItemsForSupplier } from '../../shared/itemSearch';
import { matchItems } from '../matchItems';
import { searchFragment } from '../../../utils/searchFragment';
import type { SupplierOption, ItemOption } from '../../analytics/types';

/** What an item picker shows: the matching items, and whether they are still loading. */
export interface ItemSearchResult {
  data: ItemOption[];
  isLoading: boolean;
}

/**
 * Items of the selected supplier whose name or SKU contains the query.
 *
 * - The supplier's list loads once (`GET /api/inventory/search?supplierId=`,
 *   one page of up to 2,000 items); typing sends no request.
 * - The list is kept only while that supplier is chosen: choosing another
 *   supplier, or closing the dialog, drops it at once (gcTime 0).
 * - When the page did not hold every item, or the list failed to load, the
 *   picker falls back to the server search, one request per query.
 *
 * @param selectedSupplier - Supplier whose items are searched; nothing loads
 *   until one is chosen, so items never mix across suppliers.
 * @param searchQuery - Text typed in the picker; matching starts at
 *   SEARCH_MIN_CHARS characters.
 */
export function useItemSearchQuery(
  selectedSupplier: SupplierOption | null,
  searchQuery: string
): ItemSearchResult {
  const supplierId = selectedSupplier ? String(selectedSupplier.id) : '';

  const listQuery = useQuery({
    queryKey: ['inventory', 'supplierItems', supplierId],
    queryFn: () => listItemsForSupplier(supplierId),
    enabled: supplierId !== '',
    staleTime: 30_000,
    // Drop an unused supplier's list at once (Carlos, 2026-10-06).
    gcTime: 0,
  });

  const useServer = listQuery.data?.complete === false;

  const serverQuery = useQuery({
    queryKey: ['inventory', 'search', supplierId, searchQuery],
    queryFn: () => searchItemsForSupplier(supplierId, searchQuery, 50),
    enabled: useServer && searchFragment(searchQuery) !== null,
    staleTime: 30_000,
  });

  const listItems = listQuery.data?.items;
  const matched = React.useMemo(() => matchItems(listItems ?? [], searchQuery), [listItems, searchQuery]);

  if (useServer) {
    return { data: serverQuery.data ?? [], isLoading: serverQuery.isFetching };
  }
  return { data: matched, isLoading: listQuery.isLoading };
}
