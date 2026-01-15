/**
 * @file DeleteSupplierDialog.test.tsx
 *
 * @what_is_under_test DeleteSupplierDialog component
 * @responsibility Manage deletion workflow and orchestrate search/confirmation steps
 * @out_of_scope useDeleteSupplierForm internal logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupplierRow } from '../../../../../api/suppliers/types';
import type { UseDeleteSupplierFormReturn } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm';

const useDeleteSupplierFormMock = vi.fn();
const searchComponentSpy = vi.fn();
const confirmationComponentSpy = vi.fn();
const openHelpMock = vi.fn();
const toastMock = vi.fn();

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm', () => ({
  useDeleteSupplierForm: (...args: unknown[]) => useDeleteSupplierFormMock(...args),
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearch', () => ({
  DeleteSupplierSearch: (props: unknown) => {
    searchComponentSpy(props);
    const { onCancel, onHelp, onSelectSupplier } = props as {
      onCancel: () => void;
      onHelp: () => void;
      onSelectSupplier: () => void;
    };
    return (
      <div>
        <button type="button" onClick={onCancel}>
          Cancel Search
        </button>
        <button type="button" onClick={onHelp}>
          Help
        </button>
        <button type="button" onClick={onSelectSupplier}>
          Select Supplier
        </button>
      </div>
    );
  },
}));

vi.mock('../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierConfirmation', () => ({
  DeleteSupplierConfirmation: (props: unknown) => {
    confirmationComponentSpy(props);
    const { onCancel, onConfirm } = props as { onCancel: () => void; onConfirm: () => void };
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

vi.mock('../../../../../hooks/useHelp', () => ({
  useHelp: () => ({ openHelp: openHelpMock }),
}));

vi.mock('../../../../../context/toast', () => ({
  useToast: () => toastMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { DeleteSupplierDialog } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierDialog';

const supplier: SupplierRow = {
  id: 'sup-1',
  name: 'Supplier One',
  contactName: 'Jane Doe',
  phone: '555-1000',
  email: 'jane@example.com',
};

const createFormState = (
  overrides: Partial<UseDeleteSupplierFormReturn> = {}
): UseDeleteSupplierFormReturn => ({
  searchQuery: '',
  setSearchQuery: vi.fn(),
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
  handleConfirmDelete: vi.fn(),
  resetForm: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  openHelpMock.mockClear();
  toastMock.mockClear();
});

describe('DeleteSupplierDialog', () => {
  it('initializes workflow hook and renders search step with help action', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSupplierDeleted = vi.fn();
    const formState = createFormState();
    useDeleteSupplierFormMock.mockReturnValue(formState);

    render(<DeleteSupplierDialog open={true} onClose={onClose} onSupplierDeleted={onSupplierDeleted} />);

    expect(useDeleteSupplierFormMock).toHaveBeenCalled();
    expect(searchComponentSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(openHelpMock).toHaveBeenCalledWith('suppliers.delete');
  });

  it('renders confirmation step when showConfirmation is true', () => {
    const formState = createFormState({
      showConfirmation: true,
      selectedSupplier: supplier,
    });
    useDeleteSupplierFormMock.mockReturnValue(formState);

    render(<DeleteSupplierDialog open={true} onClose={vi.fn()} onSupplierDeleted={vi.fn()} />);

    expect(confirmationComponentSpy).toHaveBeenCalledTimes(1);
    const props = confirmationComponentSpy.mock.calls[0][0] as { supplier: SupplierRow };
    expect(props.supplier).toEqual(supplier);
  });

  it('resets form and closes dialog when cancel invoked during search', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const formState = createFormState();
    useDeleteSupplierFormMock.mockReturnValue(formState);

    render(<DeleteSupplierDialog open={true} onClose={onClose} onSupplierDeleted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel Search' }));
    expect(formState.resetForm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('delegates supplier selection to workflow handler', async () => {
    const user = userEvent.setup();
    const formState = createFormState({ handleSelectSupplier: vi.fn() });
    useDeleteSupplierFormMock.mockReturnValue(formState);

    render(<DeleteSupplierDialog open={true} onClose={vi.fn()} onSupplierDeleted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Select Supplier' }));
    expect(formState.handleSelectSupplier).toHaveBeenCalledTimes(1);
  });

  it('prevents close while deletion is in progress', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const formState = createFormState({ isDeleting: true });
    useDeleteSupplierFormMock.mockReturnValue(formState);

    render(<DeleteSupplierDialog open={true} onClose={onClose} onSupplierDeleted={vi.fn()} />);

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
    useDeleteSupplierFormMock.mockReturnValue(formState);

    render(<DeleteSupplierDialog open={true} onClose={vi.fn()} onSupplierDeleted={vi.fn()} />);

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
    useDeleteSupplierFormMock.mockReturnValue(formState);

    render(<DeleteSupplierDialog open={true} onClose={vi.fn()} onSupplierDeleted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Confirm Delete' }));
    expect(formState.handleConfirmDelete).toHaveBeenCalledTimes(1);
  });
});
