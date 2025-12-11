/**
 * @file useQuantityAdjustFormState.ts
 * @module dialogs/QuantityAdjustDialog/useQuantityAdjustFormState
 *
 * @summary
 * Pure state management hook for quantity adjustment form.
 * Manages UI state: supplier selection, item selection, search query, and form errors.
 *
 * @enterprise
 * Separates state concerns from query/fetch logic for cleaner testing and composition.
 * All state updates are deterministic and testable without HTTP calls.
 */

import * as React from 'react';
import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';

/**
 * State values for quantity adjustment form.
 * 
 * @interface QuantityAdjustFormState
 * @property {SupplierOption | null} selectedSupplier - Currently selected supplier
 * @property {ItemOption | null} selectedItem - Currently selected item
 * @property {string} itemQuery - Search query for item filtering
 * @property {string} formError - Form-level error message
 */
export interface QuantityAdjustFormState {
  selectedSupplier: SupplierOption | null;
  selectedItem: ItemOption | null;
  itemQuery: string;
  formError: string;
}

/**
 * Setter functions for state management.
 * 
 * @interface QuantityAdjustFormStateSetters
 */
export interface QuantityAdjustFormStateSetters {
  setSelectedSupplier: (supplier: SupplierOption | null) => void;
  setSelectedItem: (item: ItemOption | null) => void;
  setItemQuery: (query: string) => void;
  setFormError: (error: string) => void;
}

/**
 * Pure state management hook for quantity adjustment form.
 * 
 * Provides separated state and setter functions without any async/query logic.
 * This allows for easy composition with other hooks and clean testing.
 * 
 * @returns State object and setter functions
 * 
 * @example
 * ```ts
 * const { selectedSupplier, selectedItem, ...state } = useQuantityAdjustFormState();
 * const { setSelectedSupplier, setSelectedItem, ...setters } = useQuantityAdjustFormState();
 * ```
 */
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
