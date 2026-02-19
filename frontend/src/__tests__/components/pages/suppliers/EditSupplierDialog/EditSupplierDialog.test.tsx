/**
 * @file EditSupplierDialog.test.tsx
 * @module __tests__/components/pages/suppliers/EditSupplierDialog/EditSupplierDialog
 * @description Contract tests for the `EditSupplierDialog` container.
 *
 * Contract under test:
 * - Initializes `useEditSupplierForm(onUpdated)` once per render.
 * - Wires child step components using the hook's public contract.
 * - Implements dialog lifecycle: cancel → `resetForm()` + `onClose()`.
 * - Implements review action: uses `handleSubmit` callback to populate pending changes and open confirmation.
 * - Shows/clears error alert via `formError` + `setFormError('')`.
 * - When `useEditSupplierForm` invokes the provided success callback:
 *   - shows success toast,
 *   - calls `onSupplierUpdated()`,
 *   - and closes/reset the dialog.
 *
 * Out of scope:
 * - `useEditSupplierForm` internal logic (covered by hook tests).
 * - UI implementation details of step components and MUI layout.
 *
 * Test strategy:
 * - Deterministic mocks for hook/toast/help and child step components.
 * - Assert only against the container's observable wiring and callback behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { EditSupplierForm } from '../../../../../api/suppliers';
import type { UseEditSupplierFormReturn } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm';
import type { SupplierRow } from '../../../../../api/suppliers/types';

import { editSupplierChanges, supplierRow } from './fixtures';
import { createEditSupplierDialogForm } from './testHelpers';

const mocks = vi.hoisted(() => ({
  // Hoisted to guarantee deterministic instance identity across tests and module mocks.
  // This prevents subtle issues where a mock function is captured before `beforeEach` runs.
  useEditSupplierForm: vi.fn(),
  openHelp: vi.fn(),
  toast: vi.fn(),
  searchStep: vi.fn(),
  infoStep: vi.fn(),
  confirmation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock('../../../../../context/toast', () => ({
  useToast: () => mocks.toast,
}));

vi.mock('../../../../../hooks/useHelp', () => ({
  useHelp: () => ({ openHelp: mocks.openHelp }),
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm', () => ({
  // The real hook is tested separately; the dialog container is tested here as a wiring unit.
  useEditSupplierForm: (onUpdated: () => void) => mocks.useEditSupplierForm(onUpdated),
}));

type SearchStepProps = {
  searchQuery: string;
  onSearchQueryChange: (query: string) => Promise<void>;
  searchResults: SupplierRow[];
  searchLoading: boolean;
  onSelectSupplier: (supplier: SupplierRow) => void;
};

type InfoStepProps = {
  selectedSupplier: SupplierRow | null;
  control: UseEditSupplierFormReturn['control'];
  errors: UseEditSupplierFormReturn['formState']['errors'];
  isSubmitting: boolean;
};

type ConfirmationProps = {
  open: boolean;
  supplier: SupplierRow | null;
  changes: EditSupplierForm | null;
  formError: string;
  isSubmitting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierSearchStep', () => ({
  EditSupplierSearchStep: (props: SearchStepProps) => {
    // Treat step components as black boxes; assert only the contract-level props.
    mocks.searchStep(props);
    return <div data-testid="search-step">search-step</div>;
  },
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierInfoStep', () => ({
  EditSupplierInfoStep: (props: InfoStepProps) => {
    // Contract spy: capture the props the container wires into the step.
    mocks.infoStep(props);
    return <div data-testid="info-step">info-step</div>;
  },
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierConfirmation', () => ({
  EditSupplierConfirmation: (props: ConfirmationProps) => {
    // Contract spy: confirmation is rendered from container state, not tested for UI internals here.
    mocks.confirmation(props);
    return <div data-testid="confirmation-step">confirmation</div>;
  },
}));

import { EditSupplierDialog } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierDialog';

const baseSupplier: SupplierRow = supplierRow({
  contactName: 'John Smith',
  phone: '555-1000',
  email: 'john@acme.com',
});

type RenderOverrides = Partial<{
  open: boolean;
  onClose: () => void;
  onSupplierUpdated: () => void;
}>;

const renderDialog = (form: UseEditSupplierFormReturn, overrides: RenderOverrides = {}) => {
  // Helper to keep tests focused on contract assertions, not repeated render plumbing.
  const onClose = overrides.onClose ?? vi.fn();
  const onSupplierUpdated = overrides.onSupplierUpdated ?? vi.fn();
  const open = overrides.open ?? true;

  mocks.useEditSupplierForm.mockReturnValue(form);
  render(<EditSupplierDialog open={open} onClose={onClose} onSupplierUpdated={onSupplierUpdated} />);

  return { onClose, onSupplierUpdated };
};

/**
 * Creates a deterministic `handleSubmit` mock that invokes the provided `onValid` callback.
 *
 * Why the cast exists:
 * - React Hook Form's `handleSubmit` type includes event parameters and optional invalid callbacks.
 * - For container wiring tests we only need the happy-path shape used by the dialog.
 */
const createHandleSubmitMock = (
  impl: (onValid: (values: EditSupplierForm) => Promise<void> | void) => Promise<void> | void
): UseEditSupplierFormReturn['handleSubmit'] =>
  vi.fn((onValid) => async () => {
    await impl(onValid as (values: EditSupplierForm) => Promise<void> | void);
  }) as unknown as UseEditSupplierFormReturn['handleSubmit'];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EditSupplierDialog', () => {
  it('initializes hook, renders steps, and wires help button', async () => {
    const user = userEvent.setup();
    // Build a full `useEditSupplierForm` contract so the container can wire props safely.
    const form = createEditSupplierDialogForm();
    renderDialog(form);

    expect(mocks.useEditSupplierForm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Edit Supplier' })).toBeInTheDocument();

    expect(mocks.searchStep).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: form.searchQuery,
        onSearchQueryChange: form.handleSearchQueryChange,
        searchResults: form.searchResults,
        searchLoading: form.searchLoading,
        onSelectSupplier: form.handleSelectSupplier,
      })
    );

    expect(mocks.infoStep).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedSupplier: form.selectedSupplier,
        control: form.control,
        errors: form.formState.errors,
        isSubmitting: form.formState.isSubmitting,
      })
    );

    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(mocks.openHelp).toHaveBeenCalledWith('suppliers.manage');

    expect(mocks.confirmation).toHaveBeenCalledWith(
      expect.objectContaining({
        open: form.showConfirmation,
        supplier: form.selectedSupplier,
        changes: form.pendingChanges,
        formError: form.formError,
        isSubmitting: form.formState.isSubmitting,
        onConfirm: form.handleConfirmChanges,
      })
    );
  });

  it('submits for review when a supplier is selected', async () => {
    const user = userEvent.setup();
    const submittedValues = editSupplierChanges({
      supplierId: baseSupplier.id,
      contactName: 'Jane Doe',
      phone: '555-2000',
      email: 'jane@acme.com',
    });

    const form = createEditSupplierDialogForm({
      selectedSupplier: baseSupplier,
      handleSubmit: createHandleSubmitMock(async (onValid) => {
        await onValid(submittedValues);
      }),
    });

    renderDialog(form);

    await user.click(screen.getByRole('button', { name: 'Review Changes' }));

    expect(form.handleSubmit).toHaveBeenCalledTimes(1);
    expect(form.setFormError).toHaveBeenCalledWith('');
    expect(form.setPendingChanges).toHaveBeenCalledWith(submittedValues);
    await waitFor(() => {
      expect(form.setShowConfirmation).toHaveBeenCalledWith(true);
    });
    expect(form.setFormError).toHaveBeenCalledTimes(1);
  });

  it('shows validation error when review is requested without supplier selected', async () => {
    const user = userEvent.setup();
    const form = createEditSupplierDialogForm({
      // Keep the button enabled at render time, then simulate a mid-flight deselection.
      // This exercises the dialog's defensive validation inside the submit callback.
      selectedSupplier: baseSupplier,
      handleSubmit: createHandleSubmitMock(async (onValid) => {
        form.selectedSupplier = null;
        await onValid({ supplierId: '', contactName: '', phone: '', email: '' });
      }),
    });

    renderDialog(form);

    await user.click(screen.getByRole('button', { name: 'Review Changes' }));

    expect(form.setFormError).toHaveBeenCalledWith('Please select a supplier.');
    expect(form.setPendingChanges).not.toHaveBeenCalled();
    expect(form.setShowConfirmation).not.toHaveBeenCalled();
  });

  it('resets form and closes when cancel is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const form = createEditSupplierDialogForm();
    renderDialog(form, { onClose });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(form.resetForm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clears error when alert close is clicked', async () => {
    const user = userEvent.setup();
    const form = createEditSupplierDialogForm({ formError: 'Failed to update' });
    renderDialog(form);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Failed to update');
    await user.click(screen.getByLabelText('Close'));
    expect(form.setFormError).toHaveBeenCalledWith('');
  });

  it('disables actions while submitting', () => {
    const form = createEditSupplierDialogForm({
      selectedSupplier: baseSupplier,
      formState: { errors: {}, isSubmitting: true },
    });
    renderDialog(form);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Review Changes' })).toBeDisabled();
  });

  it('shows confirmation view when review dialog is active', () => {
    const form = createEditSupplierDialogForm({ showConfirmation: true, selectedSupplier: baseSupplier });
    renderDialog(form);

    expect(screen.queryByRole('heading', { name: 'Edit Supplier' })).not.toBeInTheDocument();
    expect(mocks.confirmation).toHaveBeenCalledWith(expect.objectContaining({ open: true }));
  });

  it('invokes success callback returned to form hook', () => {
    const onClose = vi.fn();
    const onSupplierUpdated = vi.fn();
    const form = createEditSupplierDialogForm();
    renderDialog(form, { onClose, onSupplierUpdated });

    const successCallback = mocks.useEditSupplierForm.mock.calls[0][0] as () => void;
    act(() => {
      successCallback();
    });

    expect(mocks.toast).toHaveBeenCalledWith('Supplier information updated successfully!', 'success');
    expect(onSupplierUpdated).toHaveBeenCalledTimes(1);
    expect(form.resetForm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
