/**
 * usePriceChangeFormQueries - Query hooks for price change workflow
 * 
 * @module dialogs/PriceChangeDialog/usePriceChangeFormQueries
 * @description
 * Manages all data fetching via react-query:
 * suppliers list, items with search filtering, item details with current price.
 * 
 * Includes smart effects:
 * - Resets item selection when supplier changes (prevents cross-supplier errors)
 * - Refreshes form when dialog opens/closes
 */

import * as React from 'react';
import { useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery } from '../../../../api/inventory/hooks/useInventoryData';
import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';
import type { UseFormSetValue, UseFormClearErrors } from 'react-hook-form';
import type { PriceChangeForm } from '../../../../api/inventory/validation';

/**
 * Query results and loading states
 */
export interface PriceChangeFormQueries {
  suppliers: SupplierOption[];
  items: ItemOption[];
  suppliersLoading: boolean;
  itemsLoading: boolean;
  itemDetailsLoading: boolean;
  effectiveCurrentPrice: number;
  effectiveCurrentQty: number;
}

/**
 * Hook managing all price change queries with intelligent effects
 * 
 * @param isOpen - Whether dialog is open (controls supplier query firing)
 * @param selectedSupplier - Currently selected supplier (filters items)
 * @param itemQuery - Search query for item filtering
 * @param selectedItem - Currently selected item (fetches details)
 * @param setValue - RHF setValue for auto-filling form
 * @param clearErrors - RHF clearErrors for clearing validation
 */
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
