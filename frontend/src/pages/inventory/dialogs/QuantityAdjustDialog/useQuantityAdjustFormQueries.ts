/**
 * @file useQuantityAdjustFormQueries.ts
 * @module pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustFormQueries
 *
 * @summary
 * Query coordinator for the quantity-adjust flow: suppliers, item
 * search, item details, and item price. Owns two sync effects that
 * keep react-hook-form coherent with selection state.
 *
 * @enterprise
 * - Four queries, more than any other dialog in this family. The fourth
 *   (useItemPriceQuery) exists because the inventory item details
 *   endpoint does not return a guaranteed current price; analytics
 *   price-trend is the authoritative source for the most recent price.
 * - Two effects: supplier-change resets item, query, itemId, newQuantity,
 *   and clears errors; item-pick mirrors the itemId and pre-fills
 *   newQuantity from the details query's onHand.
 * - effectiveCurrentQty and effectiveCurrentPrice are derived with
 *   defensive fallbacks (details first, then search-result, then 0
 *   for quantity / null for price). The downstream presentation
 *   never needs to chain the fallback logic.
 * - The setters object passed in by the orchestrator is destructured
 *   so the supplier-change effect depends on stable useState setters,
 *   not the recreated-each-render setters object. Without the
 *   destructuring the effect fires every render.
 */

import * as React from 'react';
import { useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery } from '../../../../api/inventory/hooks';
import { useItemPriceQuery } from './useItemPriceQuery';
import type { QuantityAdjustFormState, QuantityAdjustFormStateSetters } from './useQuantityAdjustFormState';
import type { UseFormSetValue } from 'react-hook-form';
import type { QuantityAdjustForm } from '../../../../api/inventory/validation';

export interface QuantityAdjustFormQueries {
  suppliers: ReturnType<typeof useSuppliersQuery>['data'];
  suppliersLoading: boolean;
  items: ReturnType<typeof useItemSearchQuery>['data'];
  itemsLoading: boolean;
  effectiveCurrentQty: number;
  effectiveCurrentPrice: number | null;
  itemDetailsLoading: boolean;
}

export const useQuantityAdjustFormQueries = (
  state: QuantityAdjustFormState & QuantityAdjustFormStateSetters,
  setValue: UseFormSetValue<QuantityAdjustForm>,
  isDialogOpen: boolean
): QuantityAdjustFormQueries => {
  // ================================
  // Data Queries
  // ================================

  /**
   * Load suppliers for dropdown.
   * Uses shared hook for consistent caching and error handling.
   */
  const suppliersQuery = useSuppliersQuery(isDialogOpen);

  /**
   * Load items based on selected supplier and search query.
   * Uses shared hook with client-side supplier filtering.
   */
  const itemsQuery = useItemSearchQuery(state.selectedSupplier, state.itemQuery);

  /**
   * Fetch full item details including current quantity when item is selected.
   * Uses shared hook for consistent data fetching.
   */
  const itemDetailsQuery = useItemDetailsQuery(state.selectedItem?.id);

  /**
   * Fetch current price for the selected item via specialized hook.
   * Uses price trend API to get the most recent price.
   */
  const itemPriceQuery = useItemPriceQuery(state.selectedItem, state.selectedSupplier?.id);

  // ================================
  // Effects
  // ================================

  // Destructure individual setters so the dependency array uses stable
  // React useState setter references instead of the whole `setters` object
  // (which is recreated on every render, causing the effect to fire every render).
  const { setSelectedItem, setItemQuery, setFormError } = state;

  /**
   * Reset item search when supplier changes.
   * Prevents cross-supplier item selection errors.
   */
  React.useEffect(() => {
    setSelectedItem(null);
    setItemQuery('');
    setValue('itemId', '');
    setValue('newQuantity', 0);
    setFormError('');
  }, [state.selectedSupplier, setValue, setSelectedItem, setItemQuery, setFormError]);

  /**
   * Update form value when item is selected.
   * Use current quantity from selected item data.
   */
  React.useEffect(() => {
    if (state.selectedItem && itemDetailsQuery.data) {
      setValue('itemId', state.selectedItem.id);
      setValue('newQuantity', itemDetailsQuery.data.onHand);
    }
  }, [state.selectedItem, itemDetailsQuery.data, setValue]);

  // ================================
  // Derived Values
  // ================================

  /**
   * Effective current quantity:
   * - Prefer value from itemDetailsQuery (GET /api/inventory/{id})
   * - Fall back to selectedItem.onHand (search placeholder) if details not loaded yet
   */
  const effectiveCurrentQty = state.selectedItem
    ? itemDetailsQuery.data?.onHand ?? state.selectedItem.onHand ?? 0
    : 0;

  /**
   * Effective current price:
   * - Prefer value from itemPriceQuery (analytics API)
   * - Fall back to selectedItem.price (search placeholder)
   */
  const effectiveCurrentPrice =
    itemPriceQuery.data !== null && itemPriceQuery.data !== undefined
      ? itemPriceQuery.data
      : state.selectedItem?.price ?? null;

  return {
    suppliers: suppliersQuery.data,
    suppliersLoading: suppliersQuery.isLoading,
    items: itemsQuery.data,
    itemsLoading: itemsQuery.isLoading,
    effectiveCurrentQty,
    effectiveCurrentPrice,
    itemDetailsLoading: itemDetailsQuery.isLoading,
  };
};
