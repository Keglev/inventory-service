import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type { UseItemFormReturn } from '../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm';

/**
 * @file ItemFormDialog.test.tsx
 *
 * @what_is_under_test ItemFormDialog component
 * @responsibility Render dialog wrapper and manage dialog lifecycle
 * @out_of_scope useItemForm internals, form validation schema
 */

const itemFormPropsSpy = vi.fn();

vi.mock('../../../../../pages/inventory/dialogs/ItemFormDialog/ItemForm', () => ({
  ItemForm: (props: unknown) => {
    itemFormPropsSpy(props);
    return <div data-testid="item-form">Mocked ItemForm</div>;
  },
}));

const useItemFormMock = vi.fn();

vi.mock('../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm', () => ({
  useItemForm: (...args: unknown[]) => useItemFormMock(...args),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { ItemFormDialog } from '../../../../../pages/inventory/dialogs/ItemFormDialog/ItemFormDialog';
type ItemFormDialogProps = ComponentProps<typeof ItemFormDialog>;

const createState = (overrides: Partial<UseItemFormReturn> = {}): UseItemFormReturn => ({
  supplierValue: null,
  formError: null,
  setSupplierValue: vi.fn(),
  setFormError: vi.fn(),
  suppliers: [],
  register: vi.fn(),
  control: {} as UseItemFormReturn['control'],
  formState: { isSubmitting: false } as UseItemFormReturn['formState'],
  setValue: vi.fn(),
  setError: vi.fn(),
  clearErrors: vi.fn(),
  watch: vi.fn() as unknown as UseItemFormReturn['watch'],
  handleSubmit: vi.fn(() => vi.fn()) as unknown as UseItemFormReturn['handleSubmit'],
  onSubmit: vi.fn(),
  handleClose: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ItemFormDialog', () => {
  it('renders create mode title and triggers submit handler', () => {
    const submitHandler = vi.fn();
    const handleSubmitSpy = vi.fn(() => submitHandler);
    const state = createState({ handleSubmit: handleSubmitSpy, onSubmit: vi.fn() });
    useItemFormMock.mockReturnValue(state);
    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(
      <ItemFormDialog
        isOpen={true}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    expect(screen.getByRole('heading', { name: 'Create Item' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(handleSubmitSpy).toHaveBeenCalledWith(state.onSubmit);
    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(itemFormPropsSpy).toHaveBeenCalledWith(expect.objectContaining({ state, initial: undefined }));
    expect(useItemFormMock).toHaveBeenCalledWith({ isOpen: true, onClose, initial: undefined, onSaved });
  });

  it('renders edit mode and calls handleClose on cancel', () => {
    const handleCloseSpy = vi.fn();
    const state = createState({
      handleClose: handleCloseSpy,
      formState: { isSubmitting: false } as UseItemFormReturn['formState'],
    });
    useItemFormMock.mockReturnValue(state);

    render(
      <ItemFormDialog
        isOpen={true}
        initial={{ id: 'item-1', name: 'Item 1', code: 'CODE', onHand: 5 } as ItemFormDialogProps['initial']}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Edit Item' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleCloseSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows loader and disables actions while submitting', () => {
    const state = createState({
      formState: { isSubmitting: true } as UseItemFormReturn['formState'],
    });
    useItemFormMock.mockReturnValue(state);

    render(
      <ItemFormDialog isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} initial={null} />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('opens help documentation in new window for create mode', () => {
    const state = createState();
    useItemFormMock.mockReturnValue(state);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ItemFormDialog isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} initial={undefined} />
    );

    fireEvent.click(screen.getByLabelText(/help/i));
    expect(openSpy).toHaveBeenCalledWith('#/help?section=create_item', '_blank');
    openSpy.mockRestore();
  });

  it('opens edit help section when existing item provided', () => {
    const state = createState();
    useItemFormMock.mockReturnValue(state);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ItemFormDialog
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        initial={{ id: 'existing' } as ItemFormDialogProps['initial']}
      />
    );

    fireEvent.click(screen.getByLabelText(/help/i));
    expect(openSpy).toHaveBeenCalledWith('#/help?section=edit_item', '_blank');
    openSpy.mockRestore();
  });
});
