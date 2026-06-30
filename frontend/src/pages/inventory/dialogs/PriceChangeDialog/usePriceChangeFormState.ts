/**
 * @file usePriceChangeFormState.ts
 * @module pages/inventory/dialogs/PriceChangeDialog/usePriceChangeFormState
 *
 * @summary
 * Pure local-state hook for the price-change flow: selected supplier,
 * selected item, search query, and form error.
 *
 * @enterprise
 * - No effects, no queries, no react-hook-form. Pure useState. This
 *   isolation lets tests mount the orchestrator's behavior with a
 *   hand-built state replacement.
 * - Type-level split between values and setters makes the consumer
 *   contract explicit at the interface boundary.
 */

import * as React from 'react';
import type { SupplierOption, ItemOption } from '../../../../api/analytics/types';

export interface PriceChangeFormState {
  selectedSupplier: SupplierOption | null;
  selectedItem: ItemOption | null;
  itemQuery: string;
  formError: string | null;
}

export interface PriceChangeFormStateSetters {
  setSelectedSupplier: (supplier: SupplierOption | null) => void;
  setSelectedItem: (item: ItemOption | null) => void;
  setItemQuery: (query: string) => void;
  setFormError: (error: string | null) => void;
}

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
