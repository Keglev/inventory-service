/**
 * @file CreateSupplierDialog.test.tsx
 *
 * @what_is_under_test CreateSupplierDialog component
 * @responsibility Render dialog wrapper, delegate to form hook, and manage lifecycle interactions
 * @out_of_scope useCreateSupplierForm internal logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CreateSupplierForm as CreateSupplierFormData } from '../../../../../api/suppliers';
import type { UseCreateSupplierFormReturn } from '../../../../../pages/suppliers/dialogs/CreateSupplierDialog/useCreateSupplierForm';

const useCreateSupplierFormMock = vi.fn();
const supplierFormFieldsSpy = vi.fn();
const openHelpMock = vi.fn();

vi.mock('../../../../../pages/suppliers/dialogs/CreateSupplierDialog/useCreateSupplierForm', () => ({
  useCreateSupplierForm: (...args: unknown[]) => useCreateSupplierFormMock(...args),
}));

vi.mock('../../../../../pages/suppliers/dialogs/CreateSupplierDialog/CreateSupplierForm', () => ({
  SupplierFormFields: (props: unknown) => {
    supplierFormFieldsSpy(props);
    return <div data-testid="supplier-form-fields">SupplierFormFields</div>;
  },
  CreateSupplierForm: (props: unknown) => {
    supplierFormFieldsSpy(props);
    return <div data-testid="supplier-form-fields">SupplierFormFields</div>;
  },
}));

vi.mock('../../../../../hooks/useHelp', () => ({
  useHelp: () => ({ openHelp: openHelpMock }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { CreateSupplierDialog } from '../../../../../pages/suppliers/dialogs/CreateSupplierDialog/CreateSupplierDialog';

const defaultFormState = (): UseCreateSupplierFormReturn => ({
  register: vi.fn(),
  handleSubmit: vi.fn(() => vi.fn()),
  formState: { errors: {}, isSubmitting: false } as UseCreateSupplierFormReturn['formState'],
  reset: vi.fn(),
  formError: null,
  setFormError: vi.fn(),
  onSubmit: vi.fn(async () => ({ success: true })),
});

beforeEach(() => {
  vi.clearAllMocks();
  openHelpMock.mockClear();
  supplierFormFieldsSpy.mockClear();
});

describe('CreateSupplierDialog', () => {
  it('initializes form hook, renders heading, and wires help button', async () => {
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const formState = defaultFormState();
    useCreateSupplierFormMock.mockReturnValue(formState);

    render(
      <CreateSupplierDialog open={true} onClose={onClose} onCreated={onCreated} />
    );

    expect(useCreateSupplierFormMock).toHaveBeenCalledWith(onCreated);
    expect(screen.getByRole('heading', { name: /Create Supplier/ })).toBeInTheDocument();
    expect(supplierFormFieldsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        register: formState.register,
        errors: formState.formState.errors,
        isSubmitting: formState.formState.isSubmitting,
        formError: formState.formError,
      })
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(openHelpMock).toHaveBeenCalledWith('suppliers.manage');
  });

  it('resets form and closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const formState = defaultFormState();
    useCreateSupplierFormMock.mockReturnValue(formState);

    render(<CreateSupplierDialog open={true} onClose={onClose} onCreated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(formState.reset).toHaveBeenCalledTimes(1);
    expect(formState.setFormError).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits form and closes when submission succeeds', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCreated = vi.fn();
    const submitData: CreateSupplierFormData = {
      name: 'Acme Inc.',
      contactName: 'Jane Doe',
      phone: '555-1234',
      email: 'jane@example.com',
    };

    const formState = defaultFormState();
    formState.onSubmit = vi.fn(async () => ({ success: true }));
    formState.handleSubmit = vi.fn((cb) => async () => {
      await cb(submitData);
    });
    useCreateSupplierFormMock.mockReturnValue(formState);

    render(<CreateSupplierDialog open={true} onClose={onClose} onCreated={onCreated} />);

    await user.click(screen.getByRole('button', { name: 'Create Supplier' }));

    expect(formState.handleSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(formState.onSubmit).toHaveBeenCalledWith(submitData);
    });
    expect(formState.reset).toHaveBeenCalledTimes(1);
    expect(formState.setFormError).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps dialog open when submission fails', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const formState = defaultFormState();
    formState.onSubmit = vi.fn(async () => ({ success: false }));
    formState.handleSubmit = vi.fn((cb) => async () => {
      await cb({ name: 'Fail Inc.', contactName: '', phone: '', email: '' });
    });
    useCreateSupplierFormMock.mockReturnValue(formState);

    render(<CreateSupplierDialog open={true} onClose={onClose} onCreated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Create Supplier' }));

    expect(formState.handleSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(formState.onSubmit).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(formState.reset).not.toHaveBeenCalled();
  });

  it('disables actions and shows creating label while submitting', () => {
    const formState = defaultFormState();
    formState.formState = { errors: {}, isSubmitting: true } as UseCreateSupplierFormReturn['formState'];
    useCreateSupplierFormMock.mockReturnValue(formState);

    render(<CreateSupplierDialog open={true} onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    const creatingButton = screen.getByRole('button', { name: 'Creating...' });
    expect(creatingButton).toBeDisabled();
    expect(screen.getByTestId('supplier-form-fields')).toBeInTheDocument();
  });
});
