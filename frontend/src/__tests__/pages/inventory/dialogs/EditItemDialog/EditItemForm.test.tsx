/**
 * @file EditItemForm.test.tsx
 * @module __tests__/pages/inventory/dialogs/EditItemDialog/EditItemForm
 * @description Three-step rename form rendering (supplier select, item
 * autocomplete, new-name input) with progressive disclosure.
 *
 * Contract under test:
 * - Error alert renders when formError is set and dismisses via setFormError('').
 * - Step 1: supplier loading spinner vs populated select; selecting an option
 *   resolves the supplier object and forwards it to setSelectedSupplier.
 * - Step 2: info guard without a supplier, and the shared item picker
 *   (editable while items load; selection and typing are forwarded; a hint
 *   under 2 chars and a no-match message after).
 * - Step 3: hidden until an item is selected; fresh backend name wins over
 *   the search-result name; validation errors surface on the name input.
 *
 * State orchestration lives in useEditItemForm (own test); a handcrafted
 * state object drives the render here.
 *
 * The supplier pick and item-picker tests run from the shared
 * supplierItemPickerContract (sibling: DeleteFormFields.test.tsx).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

import { EditItemForm } from '@/pages/inventory/dialogs/EditItemDialog/EditItemForm';
import type { UseEditItemFormReturn } from '@/pages/inventory/dialogs/EditItemDialog/useEditItemForm';
import {
  itPicksItem,
  itPicksSupplier,
  pickerItems as items,
  pickerSuppliers as suppliers,
} from '@/__tests__/pages/inventory/dialogs/supplierItemPickerContract';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));


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

  itPicksSupplier((overrides) => setup(overrides));

  itPicksItem((overrides) => setup(overrides), {
    guard: 'guards step 2 with an info message until a supplier is selected',
    editableWhileLoading: 'keeps the item field editable while items load',
    typingForwards: 'typing in the item search forwards the query',
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
