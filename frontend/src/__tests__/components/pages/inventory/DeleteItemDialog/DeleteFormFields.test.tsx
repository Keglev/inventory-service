/**
 * @file DeleteFormFields.test.tsx
 * @module __tests__/components/pages/inventory/DeleteItemDialog/DeleteFormFields
 * @description The three step-field components of the delete flow:
 * SupplierSelectField, ItemSelectField, and ItemInfoDisplay.
 *
 * Contract under test:
 * - SupplierSelectField: loading spinner vs populated select; selecting an
 *   option resolves the id back to the supplier object.
 * - ItemSelectField: info guard without a supplier, loading spinner, item
 *   selection (forwards item + clears query), query typing, and the
 *   two-character noOptionsText threshold.
 * - ItemInfoDisplay: hidden without a selection or before details load;
 *   renders the fetched name and on-hand quantity.
 *
 * State orchestration lives in useDeleteItemDialog (own tests); a
 * handcrafted state object drives the renders here.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

import {
  SupplierSelectField,
  ItemSelectField,
  ItemInfoDisplay,
} from '../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteFormFields';
import type { UseDeleteItemDialogReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const suppliers = [
  { id: 's1', label: 'Alpha' },
  { id: 's2', label: 'Beta' },
];
const items = [
  { id: 'it-1', name: 'Blue Widget' },
  { id: 'it-2', name: 'Red Widget' },
];

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

  it('lists suppliers and resolves the selected id to the supplier object', () => {
    const setSelectedSupplier = vi.fn();
    render(<SupplierSelectField state={makeState({ setSelectedSupplier })} />);

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Beta'));

    expect(setSelectedSupplier).toHaveBeenCalledWith(suppliers[1]);
  });
});

describe('ItemSelectField', () => {
  it('guards with an info message until a supplier is selected', () => {
    render(<ItemSelectField state={makeState()} />);

    expect(screen.getByText('inventory:search.selectSupplierFirst')).toBeInTheDocument();
  });

  it('shows a loading indicator while the item search runs', () => {
    render(
      <ItemSelectField
        state={makeState({
          selectedSupplier: suppliers[0] as never,
          itemsQuery: { data: undefined, isLoading: true } as never,
        })}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('selecting an item forwards it and clears the search query', () => {
    const setSelectedItem = vi.fn();
    const setItemQuery = vi.fn();
    render(
      <ItemSelectField
        state={makeState({
          selectedSupplier: suppliers[0] as never,
          setSelectedItem,
          setItemQuery,
        })}
      />
    );

    const input = screen.getByLabelText('inventory:item');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.click(screen.getByText('Blue Widget'));

    expect(setSelectedItem).toHaveBeenCalledWith(items[0]);
    expect(setItemQuery).toHaveBeenCalledWith('');
  });

  it('typing in the search forwards the query', () => {
    const setItemQuery = vi.fn();
    render(
      <ItemSelectField
        state={makeState({ selectedSupplier: suppliers[0] as never, setItemQuery })}
      />
    );

    fireEvent.change(screen.getByLabelText('inventory:item'), { target: { value: 'blu' } });

    expect(setItemQuery).toHaveBeenCalledWith('blu');
  });

  it('prompts to type when the query is under 2 characters and nothing matches', () => {
    render(
      <ItemSelectField
        state={makeState({
          selectedSupplier: suppliers[0] as never,
          itemsQuery: { data: [], isLoading: false } as never,
          itemQuery: 'b',
        })}
      />
    );

    fireEvent.keyDown(screen.getByLabelText('inventory:item'), { key: 'ArrowDown' });

    expect(screen.getByText('inventory:search.typeToSearch')).toBeInTheDocument();
  });

  it('reports no matches once 2+ characters are typed', () => {
    render(
      <ItemSelectField
        state={makeState({
          selectedSupplier: suppliers[0] as never,
          itemsQuery: { data: [], isLoading: false } as never,
          itemQuery: 'zz',
        })}
      />
    );

    fireEvent.keyDown(screen.getByLabelText('inventory:item'), { key: 'ArrowDown' });

    expect(screen.getByText('inventory:search.noItemsFound')).toBeInTheDocument();
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
