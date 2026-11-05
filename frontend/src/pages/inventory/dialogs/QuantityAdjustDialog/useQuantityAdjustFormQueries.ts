/**
 * @file useQuantityAdjustFormQueries.ts
 * @module pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustFormQueries
 *
 * @summary
 * Query coordinator for the quantity-adjust flow: suppliers, item search, item details,
 * and item price.
 *
 * @enterprise
 * Owns two sync effects that keep react-hook-form coherent with selection state.
 *
 * - Four queries, more than any other dialog in this family; the fourth
 *   (useItemPriceQuery) reads the latest price-trend point.
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
import { useSuppliersQuery } from '../../../../api/inventory/hooks/useSuppliersQuery';
import { useItemSearchQuery } from '../../../../api/inventory/hooks/useItemSearchQuery';
import { useItemDetailsQuery } from '../../../../api/inventory/hooks/useItemDetailsQuery';
import { useItemPriceQuery } from './useItemPriceQuery';
import type { ItemSelectionState, ItemSelectionStateSetters } from '../useItemSelectionState';
import type { UseFormSetValue } from 'react-hook-form';
import type { QuantityAdjustForm } from '../../validation/inventoryValidation';

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
  state: ItemSelectionState & ItemSelectionStateSetters,
  setValue: UseFormSetValue<QuantityAdjustForm>,
  isDialogOpen: boolean
): QuantityAdjustFormQueries => {

  const suppliersQuery = useSuppliersQuery(isDialogOpen);

  // The supplier's list loads once; typing is matched in the browser
  const itemsQuery = useItemSearchQuery(state.selectedSupplier, state.itemQuery);

  const itemDetailsQuery = useItemDetailsQuery(state.selectedItem?.id);

  const itemPriceQuery = useItemPriceQuery(state.selectedItem, state.selectedSupplier?.id);

  const { setSelectedItem, setItemQuery, setFormError } = state;

  // A supplier change resets the item search, so no item from another supplier survives
  React.useEffect(() => {
    setSelectedItem(null);
    setItemQuery('');
    setValue('itemId', '');
    setValue('newQuantity', 0);
    setValue('currentQuantity', 0);
    setFormError('');
  }, [state.selectedSupplier, setValue, setSelectedItem, setItemQuery, setFormError]);

  React.useEffect(() => {
    if (state.selectedItem && itemDetailsQuery.data) {
      setValue('itemId', state.selectedItem.id);
      setValue('newQuantity', itemDetailsQuery.data.onHand);
      // Carry the live current quantity so the schema can derive the
      // change direction (see quantityAdjustSchema refinements).
      setValue('currentQuantity', itemDetailsQuery.data.onHand);
    }
  }, [state.selectedItem, itemDetailsQuery.data, setValue]);

  // Fetched details first, the search result's values until they load
  const effectiveCurrentQty = state.selectedItem
    ? itemDetailsQuery.data?.onHand ?? state.selectedItem.onHand ?? 0
    : 0;

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
