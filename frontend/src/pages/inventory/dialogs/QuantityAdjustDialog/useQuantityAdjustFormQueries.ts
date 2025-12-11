/**
 * @file useQuantityAdjustFormQueries.ts
 * @module dialogs/QuantityAdjustDialog/useQuantityAdjustFormQueries
 *
 * @summary
 * Query management hook for quantity adjustment form.
 * Handles data fetching: suppliers, items, and item details with intelligent effects.
 *
 * @enterprise
 * - Separates query/fetch logic from state and form concerns
 * - Intelligent effects reset form state on supplier changes
 * - Pre-fills quantity field with current item quantity
 * - Provides loading states for async data
 * - Uses shared hooks for consistent caching and error handling
 */

import * as React from 'react';
import { useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery } from '../../../../api/inventory/hooks/useInventoryData';
import { useItemPriceQuery } from './useItemPriceQuery';
import type { QuantityAdjustFormState, QuantityAdjustFormStateSetters } from './useQuantityAdjustFormState';
import type { UseFormSetValue } from 'react-hook-form';
import type { QuantityAdjustForm } from '../../../../api/inventory/validation';

/**
 * Query results and data loading states.
 * 
 * @interface QuantityAdjustFormQueries
 * @property {Object[]} suppliers - Array of supplier options
 * @property {boolean} suppliersLoading - Loading state for suppliers query
 * @property {Object[]} items - Array of item options filtered by supplier
 * @property {boolean} itemsLoading - Loading state for items query
 * @property {number | null} effectiveCurrentQty - Current item quantity (from details or search)
 * @property {number | null} effectiveCurrentPrice - Current item price (from trend or selected)
 * @property {boolean} itemDetailsLoading - Loading state for item details query
 */
export interface QuantityAdjustFormQueries {
  suppliers: ReturnType<typeof useSuppliersQuery>['data'];
  suppliersLoading: boolean;
  items: ReturnType<typeof useItemSearchQuery>['data'];
  itemsLoading: boolean;
  effectiveCurrentQty: number;
  effectiveCurrentPrice: number | null;
  itemDetailsLoading: boolean;
}

/**
 * Query management hook for quantity adjustment form.
 * 
 * Provides all query/fetch logic:
 * - Suppliers list (shared hook)
 * - Items filtered by supplier (shared hook)
 * - Item details including current quantity (shared hook)
 * - Item price trend (analytics API)
 * 
 * Intelligent effects:
 * - Reset item search/selection when supplier changes
 * - Pre-fill quantity field with current item quantity
 * 
 * @param state - Current form state (supplier/item selection)
 * @param setters - State setter functions
 * @param setValue - react-hook-form's setValue for syncing form state
 * @param isDialogOpen - Whether dialog is open (disables queries when closed)
 * @returns Query results and loading states
 * 
 * @example
 * ```ts
 * const queries = useQuantityAdjustFormQueries(state, setters, setValue, open);
 * return (
 *   <>
 *     <Suppliers data={queries.suppliers} loading={queries.suppliersLoading} />
 *     <Items data={queries.items} loading={queries.itemsLoading} />
 *     <CurrentQty>{queries.effectiveCurrentQty}</CurrentQty>
 *   </>
 * );
 * ```
 */
export const useQuantityAdjustFormQueries = (
  state: QuantityAdjustFormState,
  setters: QuantityAdjustFormStateSetters,
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

  /**
   * Reset item search when supplier changes.
   * Prevents cross-supplier item selection errors.
   */
  React.useEffect(() => {
    setters.setSelectedItem(null);
    setters.setItemQuery('');
    setValue('itemId', '');
    setValue('newQuantity', 0);
    setters.setFormError('');
  }, [state.selectedSupplier, setValue, setters]);

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
