/**
 * @file supplierItemPickerContract.ts
 * @module __tests__/pages/inventory/dialogs/supplierItemPickerContract
 * @testing Shared contract suite and fixtures (fork 4 B + A, 2026-10-22)
 * @description The supplier select and the shared item picker
 * (ItemSearchField) render the same way in the edit-item form and in the
 * delete-item step fields. These tests ran word for word in both specs; each
 * consumer passes a render function over its own state shape and keeps its
 * own titles. Consumers: EditItemDialog/EditItemForm.test.tsx,
 * DeleteItemDialog/DeleteFormFields.test.tsx.
 */
import { it, expect, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';

export const pickerSuppliers = [
  { id: 's1', label: 'Alpha' },
  { id: 's2', label: 'Beta' },
];
export const pickerItems = [
  { id: 'it-1', name: 'Blue Widget' },
  { id: 'it-2', name: 'Red Widget' },
];

/** Renders the unit under test from partial picker state. */
export type RenderPicker = (overrides: Record<string, unknown>) => void;

/** Titles that differ between the two consumer specs. */
export interface ItemPickerTitles {
  guard: string;
  editableWhileLoading: string;
  typingForwards: string;
}

/** Picking a supplier option hands the supplier object, not its id, to the state. */
export function itPicksSupplier(renderPicker: RenderPicker): void {
  it('lists suppliers and resolves the selected id to the supplier object', () => {
    const setSelectedSupplier = vi.fn();
    renderPicker({ setSelectedSupplier });

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Beta'));

    expect(setSelectedSupplier).toHaveBeenCalledWith(pickerSuppliers[1]);
  });
}

/** The item picker: supplier guard, loading, selection, typing and the empty-result hints. */
export function itPicksItem(renderPicker: RenderPicker, titles: ItemPickerTitles): void {
  it(titles.guard, () => {
    renderPicker({});

    expect(screen.getByText('inventory:search.selectSupplierFirst')).toBeInTheDocument();
  });

  it(titles.editableWhileLoading, () => {
    renderPicker({
      selectedSupplier: pickerSuppliers[0],
      itemsQuery: { data: [], isLoading: true },
      itemQuery: 'bl',
    });

    const input = screen.getByLabelText('inventory:item');
    expect(input).toBeEnabled();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByText('common:loading')).toBeInTheDocument();
  });

  it('forwards the item when one is selected', () => {
    const setSelectedItem = vi.fn();
    renderPicker({
      selectedSupplier: pickerSuppliers[0],
      setSelectedItem,
      itemQuery: 'widget',
    });

    const input = screen.getByLabelText('inventory:item');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.click(screen.getByText('Blue Widget'));

    expect(setSelectedItem).toHaveBeenCalledWith(pickerItems[0]);
  });

  it(titles.typingForwards, () => {
    const setItemQuery = vi.fn();
    renderPicker({ selectedSupplier: pickerSuppliers[0], setItemQuery });

    fireEvent.change(screen.getByLabelText('inventory:item'), { target: { value: 'blu' } });

    expect(setItemQuery).toHaveBeenCalledWith('blu');
  });

  it('prompts to type when the query is under 2 characters and nothing matches', () => {
    renderPicker({
      selectedSupplier: pickerSuppliers[0],
      itemsQuery: { data: [], isLoading: false },
      itemQuery: 'b',
    });

    fireEvent.keyDown(screen.getByLabelText('inventory:item'), { key: 'ArrowDown' });

    expect(screen.getByText('inventory:search.typeToSearch')).toBeInTheDocument();
  });

  it('reports no matches once 2+ characters are typed', () => {
    renderPicker({
      selectedSupplier: pickerSuppliers[0],
      itemsQuery: { data: [], isLoading: false },
      itemQuery: 'zz',
    });

    fireEvent.keyDown(screen.getByLabelText('inventory:item'), { key: 'ArrowDown' });

    expect(screen.getByText('inventory:search.noItemsFound')).toBeInTheDocument();
  });
}
