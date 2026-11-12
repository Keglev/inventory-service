/**
 * @file DeleteSupplierDialog.test.tsx
 * @module __tests__/pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierDialog
 * @description Wrapper-level contract tests for the DeleteSupplierDialog container.
 *
 * Contract under test:
 * - Initializes the workflow hook with an `onDeleted` callback.
 * - Renders the search step by default; the help affordance lives in that step.
 * - Switches to confirmation step when `showConfirmation` and `selectedSupplier` are set.
 * - Dialog close (via search cancel) resets the workflow unless deletion is in progress.
 * - Confirmation cancel resets selection/confirmation/error state.
 * - Confirmation confirm delegates to `handleConfirmDelete`.
 * - On success it notifies the parent and closes; the success toast is the parent's.
 *
 * Out of scope:
 * - `useDeleteSupplierForm` internal deletion logic (covered by hook-level tests).
 * - MUI Dialog implementation details.
 *
 * Test strategy:
 * - Deterministic, hoisted module mocks (no implicit globals).
 * - Child steps are mocked as spy boundaries; we assert prop wiring and callback delegation.
 * - i18n is mocked with tEn, so assertions read the real English copy.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupplierRow } from '@/api/suppliers/types';
import type { UseDeleteSupplierFormReturn } from '@/pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm';

type DeleteSupplierSearchProps = {
  searchQuery: string;
  onSearchQueryChange: (query: string) => Promise<void>;
  searchResults: SupplierRow[];
  searchLoading: boolean;
  onSelectSupplier: (supplier: SupplierRow) => void;
  onCancel: () => void;
};

type DeleteSupplierConfirmationProps = {
  supplier: SupplierRow;
  error: string | null;
  isDeleting: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

const mocks = vi.hoisted(() => ({
  useDeleteSupplierForm: vi.fn(),
  searchSpy: vi.fn(),
  confirmationSpy: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm', () => ({
  useDeleteSupplierForm: (...args: [onDeleted: () => void]) => mocks.useDeleteSupplierForm(...args),
}));

vi.mock('@/pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearch', () => ({
  DeleteSupplierSearch: (props: DeleteSupplierSearchProps) => {
    mocks.searchSpy(props);
    const { onCancel, onSelectSupplier } = props;
    return (
      <div>
        <button type="button" onClick={onCancel}>
          Cancel Search
        </button>
        <button type="button" onClick={() => onSelectSupplier(supplier)}>
          Select Supplier
        </button>
      </div>
    );
  },
}));

vi.mock('@/pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierConfirmation', () => ({
  DeleteSupplierConfirmation: (props: DeleteSupplierConfirmationProps) => {
    mocks.confirmationSpy(props);
    const { onCancel, onConfirm } = props;
    return (
      <div>
        <button type="button" onClick={onCancel}>
          Cancel Confirmation
        </button>
        <button type="button" onClick={onConfirm}>
          Confirm Delete
        </button>
      </div>
    );
  },
}));

vi.mock('@/context/toast/ToastContext', () => ({
  useToast: () => mocks.toast,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

import { DeleteSupplierDialog } from '@/pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierDialog';
import { tEn } from '@/__tests__/test/i18nEn';

const supplier: SupplierRow = {
  id: 'sup-1',
  name: 'Supplier One',
  contactName: 'Jane Doe',
  phone: '555-1000',
  email: 'jane@example.com',
};

// Minimal hook contract surface required by the dialog.
const baseFormState = (): UseDeleteSupplierFormReturn => ({
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  handleSearchQueryChange: vi.fn(),
  selectedSupplier: null,
  setSelectedSupplier: vi.fn(),
  handleSelectSupplier: vi.fn(),
  showConfirmation: false,
  setShowConfirmation: vi.fn(),
  isDeleting: false,
  error: null,
  setError: vi.fn(),
  handleConfirmDelete: vi.fn(async () => undefined),
  resetForm: vi.fn(),
});

const createFormState = (overrides: Partial<UseDeleteSupplierFormReturn> = {}): UseDeleteSupplierFormReturn => ({
  ...baseFormState(),
  ...overrides,
});

const renderDialog = (overrides?: {
  open?: boolean;
  onClose?: () => void;
  onSupplierDeleted?: () => void;
  formState?: UseDeleteSupplierFormReturn;
  readOnly?: boolean;
}) => {
  const props = {
    open: overrides?.open ?? true,
    onClose: overrides?.onClose ?? vi.fn(),
    onSupplierDeleted: overrides?.onSupplierDeleted ?? vi.fn(),
    readOnly: overrides?.readOnly,
  };

  mocks.useDeleteSupplierForm.mockReturnValue(overrides?.formState ?? createFormState());
  render(<DeleteSupplierDialog {...props} />);
  return props;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useDeleteSupplierForm.mockReturnValue(createFormState());
});

describe('DeleteSupplierDialog', () => {
  it('initializes workflow hook and renders the search step', () => {
    renderDialog();

    // Hook is initialized with an onDeleted callback.
    expect(mocks.useDeleteSupplierForm).toHaveBeenCalledWith(expect.any(Function), false);
    expect(mocks.searchSpy).toHaveBeenCalledTimes(1);
  });

  it('passes readOnly to the workflow hook (demo mode)', () => {
    renderDialog({ readOnly: true });

    expect(mocks.useDeleteSupplierForm).toHaveBeenCalledWith(expect.any(Function), true);
  });

  it('renders confirmation step when showConfirmation is true', () => {
    const formState = createFormState({
      showConfirmation: true,
      selectedSupplier: supplier,
    });
    renderDialog({ formState });

    expect(mocks.confirmationSpy).toHaveBeenCalledTimes(1);
    expect(mocks.confirmationSpy).toHaveBeenCalledWith(expect.objectContaining({ supplier }));
  });

  it('resets form and closes dialog when cancel invoked during search', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const formState = createFormState();
    renderDialog({ onClose, formState });

    await user.click(screen.getByRole('button', { name: 'Cancel Search' }));
    expect(formState.resetForm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('delegates supplier selection to workflow handler', async () => {
    const user = userEvent.setup();
    const formState = createFormState({ handleSelectSupplier: vi.fn() });
    renderDialog({ formState });

    await user.click(screen.getByRole('button', { name: 'Select Supplier' }));
    expect(formState.handleSelectSupplier).toHaveBeenCalledWith(supplier);
  });

  it('prevents close while deletion is in progress', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const formState = createFormState({ isDeleting: true });
    renderDialog({ onClose, formState });

    await user.click(screen.getByRole('button', { name: 'Cancel Search' }));
    expect(formState.resetForm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('handles confirmation cancel by resetting selection state', async () => {
    const user = userEvent.setup();
    const formState = createFormState({
      showConfirmation: true,
      selectedSupplier: supplier,
    });
    renderDialog({ formState });

    await user.click(screen.getByRole('button', { name: 'Cancel Confirmation' }));
    expect(formState.setShowConfirmation).toHaveBeenCalledWith(false);
    expect(formState.setSelectedSupplier).toHaveBeenCalledWith(null);
    expect(formState.setError).toHaveBeenCalledWith(null);
  });

  it('delegates confirm action to workflow handler', async () => {
    const user = userEvent.setup();
    const formState = createFormState({
      showConfirmation: true,
      selectedSupplier: supplier,
      handleConfirmDelete: vi.fn(),
    });
    renderDialog({ formState });

    await user.click(screen.getByRole('button', { name: 'Confirm Delete' }));
    expect(formState.handleConfirmDelete).toHaveBeenCalledTimes(1);
  });

  it('notifies the parent and closes without a toast of its own when the deletion succeeds', () => {
    const onClose = vi.fn();
    const onSupplierDeleted = vi.fn();
    renderDialog({ onClose, onSupplierDeleted });

    // The dialog builds the hook with an onDeleted callback (asserted above as a
    // function). Invoking it is what runs the success side effects the component owns.
    const onDeleted = mocks.useDeleteSupplierForm.mock.calls[0]?.[0] as () => void;
    onDeleted();

    // The board handler toasts; the shell's single Snackbar would show only the later call.
    expect(mocks.toast).not.toHaveBeenCalled();
    expect(onSupplierDeleted).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
