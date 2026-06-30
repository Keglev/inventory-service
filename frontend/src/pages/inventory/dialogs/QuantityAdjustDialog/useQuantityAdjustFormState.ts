/**
 * @file useQuantityAdjustFormState.ts
 * @module pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustFormState
 *
 * @summary
 * Pure local-state hook for the quantity-adjust flow: selected
 * supplier, selected item, search query, and form error.
 *
 * @enterprise
 * - No effects, no queries, no react-hook-form. Same isolation
 *   contract as usePriceChangeFormState. Tests mount the
 *   orchestrator's behavior with a hand-built state replacement.
 * - The state hook returns both values and setters from the same
 *   call (a QuantityAdjustFormState & ...Setters intersection), so
 *   consumers can pull either or both. The queries hook takes this
 *   combined object as a single parameter.
 */

import * as React from 'react';
import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';

export interface QuantityAdjustFormState {
  selectedSupplier: SupplierOption | null;
  selectedItem: ItemOption | null;
  itemQuery: string;
  formError: string;
}

export interface QuantityAdjustFormStateSetters {
  setSelectedSupplier: (supplier: SupplierOption | null) => void;
  setSelectedItem: (item: ItemOption | null) => void;
  setItemQuery: (query: string) => void;
  setFormError: (error: string) => void;
}

export const useQuantityAdjustFormState = (): QuantityAdjustFormState &
  QuantityAdjustFormStateSetters => {
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null);
  const [itemQuery, setItemQuery] = React.useState('');
  const [formError, setFormError] = React.useState('');

  return {
    selectedSupplier,
    selectedItem,
    itemQuery,
    formError,
    setSelectedSupplier,
    setSelectedItem,
    setItemQuery,
    setFormError,
  };
};
