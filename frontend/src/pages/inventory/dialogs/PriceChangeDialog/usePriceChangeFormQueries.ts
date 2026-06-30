/**
 * @file usePriceChangeFormQueries.ts
 * @module pages/inventory/dialogs/PriceChangeDialog/usePriceChangeFormQueries
 *
 * @summary
 * Query coordinator for the price-change flow: suppliers, item search,
 * item details. Owns two sync effects that keep react-hook-form state
 * coherent with selection state.
 *
 * @enterprise
 * - Same lazy-firing pattern as DeleteItemDialog and EditItemDialog:
 *   suppliers fires when the dialog opens; item search fires when a
 *   supplier is selected and the query is long enough; item details
 *   fires only when an item is picked.
 * - Two effects: supplier-change resets itemId, newPrice, and clears
 *   form errors so a clean flow restarts; item-pick mirrors the
 *   itemId into the form and pre-fills newPrice with the freshest
 *   known value (details query if loaded, search result otherwise).
 * - effectiveCurrentPrice and effectiveCurrentQty are derived once and
 *   passed to the form so the presentation never needs to chain the
 *   fallback logic.
 */

import * as React from 'react';
import { useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery } from '../../../../api/inventory/hooks';
import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';
import type { UseFormSetValue, UseFormClearErrors } from 'react-hook-form';
import type { PriceChangeForm } from '../../../../api/inventory/validation';

export interface PriceChangeFormQueries {
  suppliers: SupplierOption[];
  items: ItemOption[];
  suppliersLoading: boolean;
  itemsLoading: boolean;
  itemDetailsLoading: boolean;
  effectiveCurrentPrice: number;
  effectiveCurrentQty: number;
}

export function usePriceChangeFormQueries(
  isOpen: boolean,
  selectedSupplier: SupplierOption | null,
  itemQuery: string,
  selectedItem: ItemOption | null,
  setValue: UseFormSetValue<PriceChangeForm>,
  clearErrors: UseFormClearErrors<PriceChangeForm>
): PriceChangeFormQueries {
  // ================================
  // Queries
  // ================================

  const suppliersQuery = useSuppliersQuery(isOpen);
  const itemsQuery = useItemSearchQuery(selectedSupplier, itemQuery);
  const itemDetailsQuery = useItemDetailsQuery(selectedItem?.id);

  const effectiveCurrentPrice =
    selectedItem ? (itemDetailsQuery.data?.price ?? selectedItem.price ?? 0) : 0;
  const effectiveCurrentQty =
    selectedItem ? (itemDetailsQuery.data?.onHand ?? selectedItem.onHand ?? 0) : 0;

  // ================================
  // Effects
  // ================================

  /**
   * Reset form fields when supplier changes
   * Prevents cross-supplier selection errors and stale form data
   */
  React.useEffect(() => {
    if (!isOpen) return;
    setValue('itemId', '');
    setValue('newPrice', 0);
    clearErrors();
  }, [selectedSupplier, isOpen, setValue, clearErrors]);

  /**
   * Pre-fill form with current price when item is selected
   * Uses fetched item details (not placeholder values from search)
   */
  React.useEffect(() => {
    if (!selectedItem) return;
    setValue('itemId', selectedItem.id);
    const price = itemDetailsQuery.data?.price ?? selectedItem.price ?? 0;
    setValue('newPrice', price);
  }, [selectedItem, itemDetailsQuery.data, setValue]);

  return {
    suppliers: suppliersQuery.data ?? [],
    items: itemsQuery.data ?? [],
    suppliersLoading: suppliersQuery.isLoading,
    itemsLoading: itemsQuery.isLoading,
    itemDetailsLoading: itemDetailsQuery.isLoading,
    effectiveCurrentPrice,
    effectiveCurrentQty,
  };
}
