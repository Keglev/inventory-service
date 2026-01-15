/**
 * @file CreateSupplierForm.test.tsx
 *
 * @what_is_under_test SupplierFormFields component
 * @responsibility Render supplier creation fields and surface validation state
 * @out_of_scope React Hook Form internals
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UseFormRegister } from 'react-hook-form';
import type { CreateSupplierForm as CreateSupplierFormData } from '../../../../../api/suppliers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { SupplierFormFields } from '../../../../../pages/suppliers/dialogs/CreateSupplierDialog/CreateSupplierForm';

const createRegister = () => {
  const register: UseFormRegister<CreateSupplierFormData> = vi.fn((field: keyof CreateSupplierFormData) => ({
    name: field,
    onBlur: vi.fn(),
    onChange: vi.fn(),
    ref: vi.fn(),
  })) as unknown as UseFormRegister<CreateSupplierFormData>;
  return register;
};

describe('SupplierFormFields', () => {
  it('renders all supplier input fields and binds register calls', () => {
    const register = createRegister();

    render(
      <SupplierFormFields
        register={register}
        errors={{}}
        isSubmitting={false}
        formError={null}
      />
    );

    expect(register).toHaveBeenCalledWith('name');
    expect(register).toHaveBeenCalledWith('contactName');
    expect(register).toHaveBeenCalledWith('phone');
    expect(register).toHaveBeenCalledWith('email');

    expect(screen.getByLabelText(/Supplier Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Person/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });

  it('displays validation helper text for each invalid field', () => {
    const register = createRegister();

    render(
      <SupplierFormFields
        register={register}
        errors={{
          name: { type: 'manual', message: 'Name required' },
          contactName: { type: 'manual', message: 'Invalid contact' },
          phone: { type: 'manual', message: 'Phone required' },
          email: { type: 'manual', message: 'Invalid email' },
        }}
        isSubmitting={false}
        formError={null}
      />
    );

    expect(screen.getByText('Name required')).toBeInTheDocument();
    expect(screen.getByText('Invalid contact')).toBeInTheDocument();
    expect(screen.getByText('Phone required')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('disables all fields while submitting', () => {
    const register = createRegister();

    render(
      <SupplierFormFields
        register={register}
        errors={{}}
        isSubmitting={true}
        formError={null}
      />
    );

    expect(screen.getByLabelText(/Supplier Name/)).toBeDisabled();
    expect(screen.getByLabelText(/Contact Person/)).toBeDisabled();
    expect(screen.getByLabelText(/Phone/)).toBeDisabled();
    expect(screen.getByLabelText(/Email/)).toBeDisabled();
  });

  it('shows top-level error alert with message when present', () => {
    const register = createRegister();

    render(
      <SupplierFormFields
        register={register}
        errors={{}}
        isSubmitting={false}
        formError={'Server error occurred'}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Server error occurred');
  });
});
