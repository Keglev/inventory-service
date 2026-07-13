/**
 * @file EditItemForm.test.tsx
 * @module __tests__/components/pages/inventory/EditItemDialog/EditItemForm
 * @description Three-step rename form rendering (supplier select, item
 * autocomplete, new-name input) with progressive disclosure.
 *
 * Contract under test:
 * - Error alert renders when formError is set and dismisses via setFormError('').
 * - Step 1: supplier loading spinner vs populated select; selecting an option
 *   resolves the supplier object and forwards it to setSelectedSupplier.
 * - Step 2: info guard without a supplier, loading spinner, and the item
 *   autocomplete (selection clears the query; typing forwards the query;
 *   noOptionsText prompts to type under 2 chars and reports no matches after).
 * - Step 3: hidden until an item is selected; fresh backend name wins over
 *   the search-result name; validation errors surface on the name input.
 *
 * State orchestration lives in useEditItemForm (own test); a handcrafted
 * state object drives the render here.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

import { EditItemForm } from '../../../../../pages/inventory/dialogs/EditItemDialog/EditItemForm';
import type { UseEditItemFormReturn } from '../../../../../pages/inventory/dialogs/EditItemDialog/useEditItemForm';

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

type StateOverrides = Partial<UseEditItemFormReturn> & { nameError?: string };

/**
 * Renders EditItemForm with a real react-hook-form control so the
 * Controller-driven name input behaves like production.
 */
function Harness({ overrides }: { overrides: StateOverrides }) {
  const form = useForm<{ newName: string }>({ defaultValues: { newName: '' } });
  const { nameError, ...stateOverrides } = overrides;

  useEffect(() => {
    if (nameError) form.setError('newName', { message: nameError });
  }, [form, nameError]);

  const state = {
    selectedSupplier: null,
    selectedItem: null,
    itemQuery: '',
    formError: '',
    setSelectedSupplier: vi.fn(),
    setSelectedItem: vi.fn(),
    setItemQuery: vi.fn(),
    setFormError: vi.fn(),
    suppliersQuery: { data: suppliers, isLoading: false },
    itemsQuery: { data: items, isLoading: false },
    itemDetailsQuery: { data: undefined },
    control: form.control,
    formState: form.formState,
    setValue: form.setValue,
    onSubmit: vi.fn(),
    handleClose: vi.fn(),
    ...stateOverrides,
  } as unknown as UseEditItemFormReturn;

  return <EditItemForm state={state} />;
}

function setup(overrides: StateOverrides = {}) {
  return render(<Harness overrides={overrides} />);
}

describe('EditItemForm', () => {
  it('renders the error alert and dismisses it through setFormError', () => {
    const setFormError = vi.fn();
    setup({ formError: 'boom', setFormError });

    expect(screen.getByText('boom')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Close'));

    expect(setFormError).toHaveBeenCalledWith('');
  });

  it('shows a loading indicator while suppliers fetch', () => {
    setup({ suppliersQuery: { data: undefined, isLoading: true } as never });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByLabelText('inventory:table.supplier')).not.toBeInTheDocument();
  });

  it('lists suppliers and resolves the selected id to the supplier object', () => {
    const setSelectedSupplier = vi.fn();
    setup({ setSelectedSupplier });

    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Beta'));

    expect(setSelectedSupplier).toHaveBeenCalledWith(suppliers[1]);
  });

  it('guards step 2 with an info message until a supplier is selected', () => {
    setup();

    expect(screen.getByText('inventory:search.selectSupplierFirst')).toBeInTheDocument();
  });

  it('shows a loading indicator while items fetch', () => {
    setup({
      selectedSupplier: suppliers[0] as never,
      itemsQuery: { data: undefined, isLoading: true } as never,
    });

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('selecting an item forwards it and clears the search query', () => {
    const setSelectedItem = vi.fn();
    const setItemQuery = vi.fn();
    setup({
      selectedSupplier: suppliers[0] as never,
      setSelectedItem,
      setItemQuery,
    });

    const input = screen.getByLabelText('inventory:table.name');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.click(screen.getByText('Blue Widget'));

    expect(setSelectedItem).toHaveBeenCalledWith(items[0]);
    expect(setItemQuery).toHaveBeenCalledWith('');
  });

  it('typing in the item search forwards the query', () => {
    const setItemQuery = vi.fn();
    setup({ selectedSupplier: suppliers[0] as never, setItemQuery });

    fireEvent.change(screen.getByLabelText('inventory:table.name'), {
      target: { value: 'blu' },
    });

    expect(setItemQuery).toHaveBeenCalledWith('blu');
  });

  it('prompts to type when the query is under 2 characters and nothing matches', () => {
    setup({
      selectedSupplier: suppliers[0] as never,
      itemsQuery: { data: [], isLoading: false } as never,
      itemQuery: 'b',
    });

    fireEvent.keyDown(screen.getByLabelText('inventory:table.name'), { key: 'ArrowDown' });

    expect(screen.getByText('inventory:search.typeToSearch')).toBeInTheDocument();
  });

  it('reports no matches once 2+ characters are typed', () => {
    setup({
      selectedSupplier: suppliers[0] as never,
      itemsQuery: { data: [], isLoading: false } as never,
      itemQuery: 'zz',
    });

    fireEvent.keyDown(screen.getByLabelText('inventory:table.name'), { key: 'ArrowDown' });

    expect(screen.getByText('inventory:search.noItemsFound')).toBeInTheDocument();
  });

  it('hides step 3 until an item is selected', () => {
    setup({ selectedSupplier: suppliers[0] as never });

    expect(screen.queryByText('inventory:steps.editName')).not.toBeInTheDocument();
  });

  it('shows the search-result name until the details query lands', () => {
    setup({
      selectedSupplier: suppliers[0] as never,
      selectedItem: items[0] as never,
    });

    expect(screen.getByText('inventory:steps.editName')).toBeInTheDocument();
    expect(screen.getByText('Blue Widget')).toBeInTheDocument();
  });

  it('prefers the fresh backend name once the details query lands', () => {
    setup({
      selectedSupplier: suppliers[0] as never,
      selectedItem: items[0] as never,
      itemDetailsQuery: { data: { name: 'Fresh Name' } } as never,
    });

    expect(screen.getByText('Fresh Name')).toBeInTheDocument();
    expect(screen.queryByText('Blue Widget')).not.toBeInTheDocument();
  });

  it('surfaces the newName validation error on the input', async () => {
    setup({
      selectedSupplier: suppliers[0] as never,
      selectedItem: items[0] as never,
      nameError: 'errors:nameRequired',
    });

    expect(await screen.findByText('errors:nameRequired')).toBeInTheDocument();
  });
});
