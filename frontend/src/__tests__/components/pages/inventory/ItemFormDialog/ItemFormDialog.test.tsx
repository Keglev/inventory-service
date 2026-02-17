/**
 * @file ItemFormDialog.test.tsx
 * @module __tests__/components/pages/inventory/ItemFormDialog/ItemFormDialog
 * @description Contract tests for ItemFormDialog:
 * - Renders correct mode (create vs edit) and action labels.
 * - Wires dialog props into useItemForm and passes state into ItemForm.
 * - Submits via RHF handleSubmit(state.onSubmit) when primary action is clicked.
 * - Calls state.handleClose on cancel.
 * - Shows progress and disables actions while submitting.
 * - Opens correct help section (create/edit) in a new window.
 *
 * Out of scope:
 * - useItemForm internals (validation, mutations, toast)
 * - ItemForm field-level rendering (covered in ItemForm.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import type { UseItemFormReturn } from '../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm';
import { ItemFormDialog } from '../../../../../pages/inventory/dialogs/ItemFormDialog/ItemFormDialog';

type ItemFormDialogProps = ComponentProps<typeof ItemFormDialog>;

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const itemFormPropsSpy = vi.hoisted(() => vi.fn());
const useItemFormMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../../pages/inventory/dialogs/ItemFormDialog/ItemForm', () => ({
  ItemForm: (props: unknown) => {
    itemFormPropsSpy(props);
    return <div data-testid="item-form">Mocked ItemForm</div>;
  },
}));

vi.mock('../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm', () => ({
  useItemForm: (...args: unknown[]) => useItemFormMock(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer fallback strings for stable assertions.
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

/**
 * Build a minimal UseItemFormReturn state object that satisfies ItemFormDialog expectations.
 * Keep this aligned with how ItemFormDialog interacts with the hook return.
 */
function createState(overrides: Partial<UseItemFormReturn> = {}): UseItemFormReturn {
  const base: UseItemFormReturn = {
    supplierValue: null,
    formError: null,
    setSupplierValue: vi.fn(),
    setFormError: vi.fn(),
    suppliers: [],

    // RHF surface used by ItemForm (and indirectly by dialog submit wiring)
    register: vi.fn((name: string) => ({
      name,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    })) as UseItemFormReturn['register'],

    control: {} as UseItemFormReturn['control'],
    formState: { errors: {}, isSubmitting: false } as UseItemFormReturn['formState'],
    setValue: vi.fn(),
    setError: vi.fn(),
    clearErrors: vi.fn(),

    // watch() is an overloaded callable type; provide a callable stub.
    watch: (((field?: unknown) => {
      if (field === 'reason') return 'INITIAL_STOCK';
      return undefined;
    }) as unknown) as UseItemFormReturn['watch'],

    // Dialog calls: handleSubmit(onSubmit)() on primary action
    handleSubmit: vi.fn((fn: unknown) => {
      // Return the actual submit handler that the dialog button should execute.
      return vi.fn(() => fn);
    }) as unknown as UseItemFormReturn['handleSubmit'],

    onSubmit: vi.fn(),
    handleClose: vi.fn(),
  };

  return { ...base, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ItemFormDialog', () => {
  it('renders create mode title and submits via handleSubmit(state.onSubmit)', async () => {
    const user = userEvent.setup();

    const submitHandler = vi.fn();
    const handleSubmitSpy = vi.fn(() => submitHandler);

    const state = createState({
      handleSubmit: handleSubmitSpy as unknown as UseItemFormReturn['handleSubmit'],
      onSubmit: vi.fn(),
    });

    useItemFormMock.mockReturnValue(state);

    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(<ItemFormDialog isOpen={true} onClose={onClose} onSaved={onSaved} />);

    // Mode-specific title + primary action label
    expect(screen.getByRole('heading', { name: 'Create Item' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    // Dialog wires submit correctly: handleSubmit(state.onSubmit)()
    expect(handleSubmitSpy).toHaveBeenCalledWith(state.onSubmit);
    expect(submitHandler).toHaveBeenCalledTimes(1);

    // Dialog passes hook state down to the form
    expect(itemFormPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ state, initial: undefined }),
    );

    // Hook called with dialog contract
    expect(useItemFormMock).toHaveBeenCalledWith({
      isOpen: true,
      onClose,
      initial: undefined,
      onSaved,
    });
  });

  it('renders edit mode and calls state.handleClose on Cancel', async () => {
    const user = userEvent.setup();

    const handleCloseSpy = vi.fn();
    const state = createState({
      handleClose: handleCloseSpy,
      formState: { errors: {}, isSubmitting: false } as UseItemFormReturn['formState'],
    });

    useItemFormMock.mockReturnValue(state);

    render(
      <ItemFormDialog
        isOpen={true}
        initial={{ id: 'item-1', name: 'Item 1', code: 'CODE', onHand: 5 } as ItemFormDialogProps['initial']}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Edit Item' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('shows progress indicator and disables actions while submitting', () => {
    const state = createState({
      formState: { errors: {}, isSubmitting: true } as UseItemFormReturn['formState'],
    });

    useItemFormMock.mockReturnValue(state);

    render(<ItemFormDialog isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} initial={null} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('opens create help section in a new window when creating', async () => {
    const user = userEvent.setup();

    useItemFormMock.mockReturnValue(createState());

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<ItemFormDialog isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} initial={undefined} />);

    await user.click(screen.getByLabelText(/help/i));
    expect(openSpy).toHaveBeenCalledWith('#/help?section=create_item', '_blank');

    openSpy.mockRestore();
  });

  it('opens edit help section in a new window when editing', async () => {
    const user = userEvent.setup();

    useItemFormMock.mockReturnValue(createState());

    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ItemFormDialog
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        initial={{ id: 'existing' } as ItemFormDialogProps['initial']}
      />,
    );

    await user.click(screen.getByLabelText(/help/i));
    expect(openSpy).toHaveBeenCalledWith('#/help?section=edit_item', '_blank');

    openSpy.mockRestore();
  });
});
