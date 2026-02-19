/**
 * @file CreateSupplierForm.test.tsx
 * @module __tests__/components/pages/suppliers/CreateSupplierDialog/CreateSupplierForm
 * @description Contract tests for the `SupplierFormFields` presentation component.
 *
 * Contract under test:
 * - Renders the four expected inputs (name, contactName, phone, email) with stable labels.
 * - Binds each field via the provided `register` function.
 * - Surfaces per-field validation errors as helper text.
 * - Disables all fields while submitting.
 * - Surfaces a top-level banner error when `formError` is present.
 *
 * Out of scope:
 * - React Hook Form behavior (we only assert that `register` is called and props flow through).
 * - MUI implementation details (we assert accessible labels/roles, not internal structure).
 *
 * Test strategy:
 * - i18n `t()` is mocked to return the fallback/defaultValue for deterministic text.
 * - `register` is a small typed fake that mimics the minimum RHF contract used by MUI TextField.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type { FieldError, FieldErrors, UseFormRegister } from 'react-hook-form';
import type { CreateSupplierForm as CreateSupplierFormData } from '../../../../../api/suppliers';

vi.mock('react-i18next', () => ({
  // Prefer fallback/defaultValue to keep assertions stable across locales.
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { SupplierFormFields } from '../../../../../pages/suppliers/dialogs/CreateSupplierDialog/CreateSupplierForm';

// -------------------------------------
// Test helpers
// -------------------------------------

// Typed, minimal RHF register stub.
// Note: RHF's `UseFormRegister` has a rich return type; this fake only implements what MUI consumes.
const createRegister = (): UseFormRegister<CreateSupplierFormData> =>
  vi.fn((field: keyof CreateSupplierFormData) => ({
    name: field,
    onBlur: vi.fn(),
    onChange: vi.fn(),
    ref: vi.fn(),
  })) as unknown as UseFormRegister<CreateSupplierFormData>;

// Convenience factory to keep error setup compact and consistent.
const fieldError = (message: string): FieldError => ({
  type: 'manual',
  message,
});

// Centralized render helper so each test only specifies the contract inputs it cares about.
const renderFields = (overrides?: Partial<ComponentProps<typeof SupplierFormFields>>) => {
  const props: ComponentProps<typeof SupplierFormFields> = {
    register: createRegister(),
    errors: {} as FieldErrors<CreateSupplierFormData>,
    isSubmitting: false,
    formError: null,
    ...overrides,
  };

  render(<SupplierFormFields {...props} />);
  return props;
};

describe('SupplierFormFields', () => {
  it('renders all supplier input fields and binds register calls', () => {
    const { register } = renderFields();

    // Contract: the component must bind all fields via `register`.
    (['name', 'contactName', 'phone', 'email'] as const satisfies Array<keyof CreateSupplierFormData>)
      .forEach((field) => expect(register).toHaveBeenCalledWith(field));

    // Contract: stable labels are present (drives accessibility and test resilience).
    expect(screen.getByLabelText(/Supplier Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Person/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });

  it('displays validation helper text for each invalid field', () => {
    renderFields({
      errors: {
        name: fieldError('Name required'),
        contactName: fieldError('Invalid contact'),
        phone: fieldError('Phone required'),
        email: fieldError('Invalid email'),
      } as FieldErrors<CreateSupplierFormData>,
    });

    ['Name required', 'Invalid contact', 'Phone required', 'Invalid email'].forEach((msg) => {
      expect(screen.getByText(msg)).toBeInTheDocument();
    });
  });

  it('disables all fields while submitting', () => {
    renderFields({ isSubmitting: true });

    // Contract: all inputs are disabled while `isSubmitting` is true.
    [/Supplier Name/, /Contact Person/, /Phone/, /Email/].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeDisabled();
    });
  });

  it('shows top-level error alert with message when present', () => {
    renderFields({ formError: 'Server error occurred' });

    // Banner error should be discoverable via `role=alert`.
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Server error occurred');
  });
});
