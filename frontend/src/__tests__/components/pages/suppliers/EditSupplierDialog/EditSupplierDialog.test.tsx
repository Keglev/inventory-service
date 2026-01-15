/**
 * @file EditSupplierDialog.test.tsx
 *
 * @what_is_under_test EditSupplierDialog component
 * @responsibility Render dialog wrapper and delegate workflow to hook
 * @out_of_scope useEditSupplierForm internal implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { EditSupplierForm } from '../../../../../api/suppliers';
import type { UseEditSupplierFormReturn } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm';
import type { SupplierRow } from '../../../../../api/suppliers/types';

const useEditSupplierFormMock = vi.fn();
const searchStepSpy = vi.fn();
const infoStepSpy = vi.fn();
const confirmationSpy = vi.fn();
const openHelpMock = vi.fn();
const toastMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock('../../../../../context/toast', () => ({
  useToast: () => toastMock,
}));

vi.mock('../../../../../hooks/useHelp', () => ({
  useHelp: () => ({ openHelp: openHelpMock }),
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm', () => ({
  useEditSupplierForm: (...args: unknown[]) => useEditSupplierFormMock(...args),
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierSearchStep', () => ({
  EditSupplierSearchStep: (props: unknown) => {
    searchStepSpy(props);
    return <div data-testid="search-step">search-step</div>;
  },
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierInfoStep', () => ({
  EditSupplierInfoStep: (props: unknown) => {
    infoStepSpy(props);
    return <div data-testid="info-step">info-step</div>;
  },
}));

vi.mock('../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierConfirmation', () => ({
  EditSupplierConfirmation: (props: unknown) => {
    confirmationSpy(props);
    return <div data-testid="confirmation-step">confirmation</div>;
  },
}));

import { EditSupplierDialog } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierDialog';

type FormStateOverrides = Partial<UseEditSupplierFormReturn> & {
  formState?: UseEditSupplierFormReturn['formState'];
  selectedSupplier?: SupplierRow | null;
  showConfirmation?: boolean;
  pendingChanges?: EditSupplierForm | null;
  formError?: string;
};

type MockFn = ReturnType<typeof vi.fn>;

interface FormStateFactoryResult {
  form: UseEditSupplierFormReturn;
  mocks: {
    handleSearchQueryChange: MockFn;
    handleSelectSupplier: MockFn;
    handleSubmit: MockFn;
    setValue: MockFn;
    setShowConfirmation: MockFn;
    setPendingChanges: MockFn;
    setFormError: MockFn;
    handleConfirmChanges: MockFn;
    resetForm: MockFn;
    onSelectSupplierAndLoadForm: MockFn;
  };
}

const baseSupplier: SupplierRow = {
  id: 'supplier-1',
  name: 'Acme Corp',
  contactName: 'John Smith',
  phone: '555-1000',
  email: 'john@acme.com',
  createdBy: 'owner@example.com',
  createdAt: '2023-01-01',
};

const createFormState = (overrides: FormStateOverrides = {}): FormStateFactoryResult => {
  const handleSearchQueryChangeFn =
    overrides.handleSearchQueryChange ?? (vi.fn() as UseEditSupplierFormReturn['handleSearchQueryChange']);
  const handleSelectSupplierFn =
    overrides.handleSelectSupplier ?? (vi.fn() as UseEditSupplierFormReturn['handleSelectSupplier']);
  const handleSubmitFn =
    overrides.handleSubmit ?? (vi.fn(() => vi.fn()) as UseEditSupplierFormReturn['handleSubmit']);
  const setValueFn = overrides.setValue ?? (vi.fn() as UseEditSupplierFormReturn['setValue']);
  const setShowConfirmationFn =
    overrides.setShowConfirmation ?? (vi.fn() as UseEditSupplierFormReturn['setShowConfirmation']);
  const setPendingChangesFn =
    overrides.setPendingChanges ?? (vi.fn() as UseEditSupplierFormReturn['setPendingChanges']);
  const setFormErrorFn = overrides.setFormError ?? (vi.fn() as UseEditSupplierFormReturn['setFormError']);
  const handleConfirmChangesFn =
    overrides.handleConfirmChanges ?? (vi.fn() as UseEditSupplierFormReturn['handleConfirmChanges']);
  const resetFormFn = overrides.resetForm ?? (vi.fn() as UseEditSupplierFormReturn['resetForm']);
  const onSelectSupplierAndLoadFormFn =
    overrides.onSelectSupplierAndLoadForm ?? (vi.fn() as UseEditSupplierFormReturn['onSelectSupplierAndLoadForm']);

  const form: UseEditSupplierFormReturn = {
    searchQuery: overrides.searchQuery ?? '',
    searchResults: overrides.searchResults ?? [],
    searchLoading: overrides.searchLoading ?? false,
    handleSearchQueryChange: handleSearchQueryChangeFn,
    selectedSupplier: overrides.selectedSupplier ?? null,
    handleSelectSupplier: handleSelectSupplierFn,
    register: overrides.register ?? (vi.fn() as unknown as UseEditSupplierFormReturn['register']),
    control: overrides.control ?? ({} as UseEditSupplierFormReturn['control']),
    formState: {
      ...(overrides.formState ?? ({ errors: {}, isSubmitting: false } as UseEditSupplierFormReturn['formState'])),
    },
    handleSubmit: handleSubmitFn,
    setValue: setValueFn,
    showConfirmation: overrides.showConfirmation ?? false,
    setShowConfirmation: setShowConfirmationFn,
    pendingChanges: overrides.pendingChanges ?? null,
    setPendingChanges: setPendingChangesFn,
    formError: overrides.formError ?? '',
    setFormError: setFormErrorFn,
    handleConfirmChanges: handleConfirmChangesFn,
    resetForm: resetFormFn,
    onSelectSupplierAndLoadForm: onSelectSupplierAndLoadFormFn,
  };

  return {
    form,
    mocks: {
      handleSearchQueryChange: handleSearchQueryChangeFn as unknown as MockFn,
      handleSelectSupplier: handleSelectSupplierFn as unknown as MockFn,
      handleSubmit: handleSubmitFn as unknown as MockFn,
      setValue: setValueFn as unknown as MockFn,
      setShowConfirmation: setShowConfirmationFn as unknown as MockFn,
      setPendingChanges: setPendingChangesFn as unknown as MockFn,
      setFormError: setFormErrorFn as unknown as MockFn,
      handleConfirmChanges: handleConfirmChangesFn as unknown as MockFn,
      resetForm: resetFormFn as unknown as MockFn,
      onSelectSupplierAndLoadForm: onSelectSupplierAndLoadFormFn as unknown as MockFn,
    },
  };
};

beforeEach(() => {
  vi.clearAllMocks();
  searchStepSpy.mockClear();
  infoStepSpy.mockClear();
  confirmationSpy.mockClear();
  openHelpMock.mockClear();
  toastMock.mockClear();
});

describe('EditSupplierDialog', () => {
  it('initializes hook, renders steps, and wires help button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSupplierUpdated = vi.fn();
    const { form } = createFormState();
    useEditSupplierFormMock.mockReturnValue(form);

    render(<EditSupplierDialog open={true} onClose={onClose} onSupplierUpdated={onSupplierUpdated} />);

    expect(useEditSupplierFormMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Edit Supplier' })).toBeInTheDocument();

    expect(searchStepSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        searchQuery: form.searchQuery,
        onSearchQueryChange: form.handleSearchQueryChange,
        searchResults: form.searchResults,
        searchLoading: form.searchLoading,
        onSelectSupplier: form.handleSelectSupplier,
      })
    );

    expect(infoStepSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedSupplier: form.selectedSupplier,
        control: form.control,
        errors: form.formState.errors,
        isSubmitting: form.formState.isSubmitting,
      })
    );

    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(openHelpMock).toHaveBeenCalledWith('suppliers.manage');

    expect(confirmationSpy).toHaveBeenCalledWith(
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
    const onClose = vi.fn();
    const onSupplierUpdated = vi.fn();
    const submittedValues: EditSupplierForm = {
      supplierId: baseSupplier.id,
      contactName: 'Jane Doe',
      phone: '555-2000',
      email: 'jane@acme.com',
    };

    const { form, mocks } = createFormState({
      selectedSupplier: baseSupplier,
      handleSubmit: vi.fn((cb) => async () => {
        await cb(submittedValues);
      }),
    });

    useEditSupplierFormMock.mockReturnValue(form);

    render(<EditSupplierDialog open={true} onClose={onClose} onSupplierUpdated={onSupplierUpdated} />);

    await user.click(screen.getByRole('button', { name: 'Review Changes' }));

    expect(mocks.handleSubmit).toHaveBeenCalledTimes(1);
    expect(mocks.setFormError).toHaveBeenCalledWith('');
    expect(mocks.setPendingChanges).toHaveBeenCalledWith(submittedValues);
    await waitFor(() => {
      expect(mocks.setShowConfirmation).toHaveBeenCalledWith(true);
    });
    expect(mocks.setFormError).toHaveBeenCalledTimes(1);
  });

  it('shows validation error when review is requested without supplier selected', async () => {
    const user = userEvent.setup();
    const { form, mocks } = createFormState({
      selectedSupplier: baseSupplier,
      handleSubmit: vi.fn((cb) => async () => {
        (form as { selectedSupplier: SupplierRow | null }).selectedSupplier = null;
        await cb({
          supplierId: '',
          contactName: '',
          phone: '',
          email: '',
        });
      }),
    });
    useEditSupplierFormMock.mockReturnValue(form);

    render(<EditSupplierDialog open={true} onClose={vi.fn()} onSupplierUpdated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Review Changes' }));

    expect(mocks.setFormError).toHaveBeenCalledWith('Please select a supplier.');
    expect(mocks.setPendingChanges).not.toHaveBeenCalled();
    expect(mocks.setShowConfirmation).not.toHaveBeenCalled();
  });

  it('resets form and closes when cancel is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { form, mocks } = createFormState();
    useEditSupplierFormMock.mockReturnValue(form);

    render(<EditSupplierDialog open={true} onClose={onClose} onSupplierUpdated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.resetForm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clears error when alert close is clicked', async () => {
    const user = userEvent.setup();
    const { form, mocks } = createFormState({ formError: 'Failed to update' });
    useEditSupplierFormMock.mockReturnValue(form);

    render(<EditSupplierDialog open={true} onClose={vi.fn()} onSupplierUpdated={vi.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Failed to update');
    await user.click(screen.getByLabelText('Close'));
    expect(mocks.setFormError).toHaveBeenCalledWith('');
  });

  it('disables actions while submitting', () => {
    const { form } = createFormState({
      selectedSupplier: baseSupplier,
      formState: { errors: {}, isSubmitting: true } as UseEditSupplierFormReturn['formState'],
    });
    useEditSupplierFormMock.mockReturnValue(form);

    render(<EditSupplierDialog open={true} onClose={vi.fn()} onSupplierUpdated={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Review Changes' })).toBeDisabled();
  });

  it('shows confirmation view when review dialog is active', () => {
    const { form } = createFormState({ showConfirmation: true, selectedSupplier: baseSupplier });
    useEditSupplierFormMock.mockReturnValue(form);

    render(<EditSupplierDialog open={true} onClose={vi.fn()} onSupplierUpdated={vi.fn()} />);

    expect(screen.queryByRole('heading', { name: 'Edit Supplier' })).not.toBeInTheDocument();
    expect(confirmationSpy).toHaveBeenCalledWith(
      expect.objectContaining({ open: true })
    );
  });

  it('invokes success callback returned to form hook', () => {
    const onClose = vi.fn();
    const onSupplierUpdated = vi.fn();
    const { form, mocks } = createFormState();
    useEditSupplierFormMock.mockReturnValue(form);

    render(<EditSupplierDialog open={true} onClose={onClose} onSupplierUpdated={onSupplierUpdated} />);

    const successCallback = useEditSupplierFormMock.mock.calls[0][0] as () => void;
    act(() => {
      successCallback();
    });

    expect(toastMock).toHaveBeenCalledWith('Supplier information updated successfully!', 'success');
    expect(onSupplierUpdated).toHaveBeenCalledTimes(1);
    expect(mocks.resetForm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
