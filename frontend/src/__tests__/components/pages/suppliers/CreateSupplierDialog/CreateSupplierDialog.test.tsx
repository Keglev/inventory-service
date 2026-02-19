/**
 * @file CreateSupplierDialog.test.tsx
 * @module __tests__/components/pages/suppliers/CreateSupplierDialog/CreateSupplierDialog
 * @description Wrapper-level contract tests for the CreateSupplierDialog container.
 *
 * Contract under test:
 * - Initializes the orchestration hook with the parent callback (`onCreated`).
 * - Renders stable dialog UI (title/heading and action buttons).
 * - Delegates field rendering to `SupplierFormFields` with the hook's public contract.
 * - Wires Help action to `useHelp().openHelp('suppliers.manage')`.
 * - Cancel triggers the dialog close lifecycle: reset form state, clear banner error, invoke `onClose`.
 * - Submit delegates to the hook and closes only on `{ success: true }`.
 * - While submitting, actions are disabled and the primary action label switches to "Creating...".
 *
 * Out of scope:
 * - `useCreateSupplierForm` internal validation/mapping logic (covered by hook tests).
 * - MUI Dialog implementation details and layout.
 *
 * Test strategy:
 * - Deterministic module mocks via `vi.hoisted` (no implicit globals).
 * - `SupplierFormFields` is mocked as a spy-only boundary: we assert props, not MUI internals.
 * - i18n `t()` returns `fallback`/defaultValue to keep text assertions stable across locales.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CreateSupplierForm as CreateSupplierFormData } from '../../../../../api/suppliers';
import type { UseCreateSupplierFormReturn } from '../../../../../pages/suppliers/dialogs/CreateSupplierDialog/useCreateSupplierForm';

type SupplierFormFieldsProps = {
  register: UseCreateSupplierFormReturn['register'];
  errors: UseCreateSupplierFormReturn['formState']['errors'];
  isSubmitting: boolean;
  formError: string | null;
};

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mocks = vi.hoisted(() => ({
  useCreateSupplierForm: vi.fn(),
  supplierFormFieldsSpy: vi.fn(),
  openHelp: vi.fn(),
}));

vi.mock('../../../../../pages/suppliers/dialogs/CreateSupplierDialog/useCreateSupplierForm', () => ({
  // Keep mock signature explicit: the dialog passes `onCreated` only.
  useCreateSupplierForm: (...args: [onCreated: () => void]) => mocks.useCreateSupplierForm(...args),
}));

vi.mock('../../../../../pages/suppliers/dialogs/CreateSupplierDialog/CreateSupplierForm', () => ({
  SupplierFormFields: (props: SupplierFormFieldsProps) => {
    // Spy on the presentation boundary instead of asserting MUI field internals.
    mocks.supplierFormFieldsSpy(props);
    return <div data-testid="supplier-form-fields" />;
  },
}));

vi.mock('../../../../../hooks/useHelp', () => ({
  useHelp: () => ({ openHelp: mocks.openHelp }),
}));

vi.mock('react-i18next', () => ({
  // Prefer fallback/defaultValue so assertions don't depend on translation files.
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { CreateSupplierDialog } from '../../../../../pages/suppliers/dialogs/CreateSupplierDialog/CreateSupplierDialog';

// Minimal hook contract surface required by `CreateSupplierDialog`.
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
});

// -------------------------------------
// Test helpers
// -------------------------------------
const renderDialog = (overrides?: {
  open?: boolean;
  onClose?: () => void;
  onCreated?: () => void;
}) => {
  const props = {
    open: overrides?.open ?? true,
    onClose: overrides?.onClose ?? vi.fn(),
    onCreated: overrides?.onCreated ?? vi.fn(),
  };

  render(<CreateSupplierDialog {...props} />);
  return props;
};

describe('CreateSupplierDialog', () => {
  it('initializes form hook, renders heading, and wires help button', async () => {
    const formState = defaultFormState();
    const onCreated = vi.fn();
    mocks.useCreateSupplierForm.mockReturnValue(formState);

    renderDialog({ onCreated });

    expect(mocks.useCreateSupplierForm).toHaveBeenCalledWith(onCreated);

    // Title uses defaultValue "Create Supplier" (stable contract for UX).
    expect(screen.getByRole('heading', { name: /Create Supplier/ })).toBeInTheDocument();

    // Field boundary: we only verify the dialog passes the hook's public contract through.
    expect(mocks.supplierFormFieldsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        register: formState.register,
        errors: formState.formState.errors,
        isSubmitting: formState.formState.isSubmitting,
        formError: formState.formError,
      })
    );

    const user = userEvent.setup();
    // Help is routed via `useHelp` rather than a direct link.
    await user.click(screen.getByRole('button', { name: 'Help' }));
    expect(mocks.openHelp).toHaveBeenCalledWith('suppliers.manage');
  });

  it('resets form and closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const formState = defaultFormState();
    mocks.useCreateSupplierForm.mockReturnValue(formState);

    renderDialog({ onClose });

    // Cancel is implemented as the dialog close lifecycle.
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
    mocks.useCreateSupplierForm.mockReturnValue(formState);

    renderDialog({ onClose, onCreated });

    // Primary action delegates to RHF `handleSubmit`, which then calls our async handler.
    await user.click(screen.getByRole('button', { name: 'Create Supplier' }));

    expect(formState.handleSubmit).toHaveBeenCalledTimes(1);
    // The hook is responsible for API orchestration; the dialog only sequences close on success.
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
    mocks.useCreateSupplierForm.mockReturnValue(formState);

    renderDialog({ onClose });

    await user.click(screen.getByRole('button', { name: 'Create Supplier' }));

    expect(formState.handleSubmit).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(formState.onSubmit).toHaveBeenCalled();
    });

    // Failure contract: do not close/reset (dialog stays open for error correction).
    expect(onClose).not.toHaveBeenCalled();
    expect(formState.reset).not.toHaveBeenCalled();
  });

  it('disables actions and shows creating label while submitting', () => {
    const formState = defaultFormState();
    formState.formState = { errors: {}, isSubmitting: true } as UseCreateSupplierFormReturn['formState'];
    mocks.useCreateSupplierForm.mockReturnValue(formState);

    renderDialog();

    // Submit-in-flight disables both actions and flips the primary button label.
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    const creatingButton = screen.getByRole('button', { name: 'Creating...' });
    expect(creatingButton).toBeDisabled();
    expect(screen.getByTestId('supplier-form-fields')).toBeInTheDocument();
  });
});
