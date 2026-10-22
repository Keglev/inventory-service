/**
 * @file DeleteFormFields.test.tsx
 * @module __tests__/pages/inventory/dialogs/DeleteItemDialog/DeleteFormFields
 * @description The three step-field components of the delete flow:
 * SupplierSelectField, ItemSelectField, and ItemInfoDisplay.
 *
 * Contract under test:
 * - SupplierSelectField: loading spinner vs populated select; selecting an
 *   option resolves the id back to the supplier object.
 * - ItemSelectField: info guard without a supplier; the shared item picker
 *   stays editable while items load, forwards a picked item and typed text,
 *   hints under two characters and reports no matches after.
 * - ItemInfoDisplay: hidden without a selection or before details load;
 *   renders the fetched name and on-hand quantity.
 *
 * State orchestration lives in useDeleteItemDialog (own tests); a
 * handcrafted state object drives the renders here.
 *
 * The supplier pick and item-picker tests run from the shared
 * supplierItemPickerContract (sibling: EditItemForm.test.tsx).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import {
  SupplierSelectField,
  ItemSelectField,
  ItemInfoDisplay,
} from '@/pages/inventory/dialogs/DeleteItemDialog/DeleteFormFields';
import type { UseDeleteItemDialogReturn } from '@/pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog.types';
import {
  itPicksItem,
  itPicksSupplier,
  pickerItems as items,
  pickerSuppliers as suppliers,
} from '@/__tests__/pages/inventory/dialogs/supplierItemPickerContract';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));


function makeState(overrides: Partial<UseDeleteItemDialogReturn> = {}) {
  return {
    selectedSupplier: null,
    selectedItem: null,
    itemQuery: '',
    setSelectedSupplier: vi.fn(),
    setSelectedItem: vi.fn(),
    setItemQuery: vi.fn(),
    suppliersQuery: { data: suppliers, isLoading: false },
    itemsQuery: { data: items, isLoading: false },
    itemDetailsQuery: { data: undefined },
    ...overrides,
  } as unknown as UseDeleteItemDialogReturn;
}

describe('SupplierSelectField', () => {
  it('shows a loading indicator while suppliers fetch', () => {
    render(
      <SupplierSelectField
        state={makeState({ suppliersQuery: { data: undefined, isLoading: true } as never })}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  itPicksSupplier((overrides) => render(<SupplierSelectField state={makeState(overrides)} />));
});

describe('ItemSelectField', () => {
  itPicksItem((overrides) => render(<ItemSelectField state={makeState(overrides)} />), {
    guard: 'guards with an info message until a supplier is selected',
    editableWhileLoading: 'keeps the item field editable while the items load',
    typingForwards: 'typing in the search forwards the query',
  });
});

describe('ItemInfoDisplay', () => {
  it('renders nothing without a selected item', () => {
    const { container } = render(<ItemInfoDisplay state={makeState()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while details are still loading', () => {
    const { container } = render(
      <ItemInfoDisplay
        state={makeState({
          selectedItem: items[0] as never,
          itemDetailsQuery: { data: undefined } as never,
        })}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the fetched name and on-hand quantity', () => {
    render(
      <ItemInfoDisplay
        state={makeState({
          selectedItem: items[0] as never,
          itemDetailsQuery: { data: { name: 'Fresh Widget', onHand: 42 } } as never,
        })}
      />
    );

    expect(screen.getByText('inventory:table.name')).toBeInTheDocument();
    expect(screen.getByText('Fresh Widget')).toBeInTheDocument();
    expect(screen.getByText('inventory:table.onHand')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
