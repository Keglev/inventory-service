/**
 * @file useItemSelectionState.ts
 * @module pages/inventory/dialogs/useItemSelectionState
 *
 * @summary
 * The selection state every item dialog starts from: the chosen supplier, the
 * chosen item, the item search text and the dialog's error message.
 *
 * @enterprise
 * The delete, edit, price-change and quantity-adjust dialogs each declared
 * these four values themselves (jscpd, LO-3), with the error typed as
 * `string | null` in one and `string` in the others. One hook keeps them
 * identical; an empty string means "no error" in every dialog. Pure useState,
 * so a dialog's own effects and queries stay in its own hook.
 */

import * as React from 'react';
import type { SupplierOption, ItemOption } from '../../../api/analytics/types';

/** Current selection values of an item dialog. */
export interface ItemSelectionState {
  selectedSupplier: SupplierOption | null;
  selectedItem: ItemOption | null;
  itemQuery: string;
  formError: string;
}

/** Setters for {@link ItemSelectionState}. */
export interface ItemSelectionStateSetters {
  setSelectedSupplier: (supplier: SupplierOption | null) => void;
  setSelectedItem: (item: ItemOption | null) => void;
  setItemQuery: (query: string) => void;
  setFormError: (error: string) => void;
}

/** @returns the selection values and their setters, all starting empty */
export function useItemSelectionState(): ItemSelectionState & ItemSelectionStateSetters {
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
}
