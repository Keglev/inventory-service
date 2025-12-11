/**
 * usePriceChangeFormState - State management for price change workflow
 * 
 * @module dialogs/PriceChangeDialog/usePriceChangeFormState
 * @description
 * Manages all component state for price change dialog:
 * selected supplier, selected item, search query, and form errors.
 */

import * as React from 'react';
import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';

/**
 * Price change form state
 */
export interface PriceChangeFormState {
  selectedSupplier: SupplierOption | null;
  selectedItem: ItemOption | null;
  itemQuery: string;
  formError: string | null;
}

/**
 * State setters
 */
export interface PriceChangeFormStateSetters {
  setSelectedSupplier: (supplier: SupplierOption | null) => void;
  setSelectedItem: (item: ItemOption | null) => void;
  setItemQuery: (query: string) => void;
  setFormError: (error: string | null) => void;
}

/**
 * Hook managing all price change form state
 */
export function usePriceChangeFormState(): PriceChangeFormState & PriceChangeFormStateSetters {
  const [selectedSupplier, setSelectedSupplier] = React.useState<SupplierOption | null>(null);
  const [selectedItem, setSelectedItem] = React.useState<ItemOption | null>(null);
  const [itemQuery, setItemQuery] = React.useState('');
  const [formError, setFormError] = React.useState<string | null>(null);

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
}
