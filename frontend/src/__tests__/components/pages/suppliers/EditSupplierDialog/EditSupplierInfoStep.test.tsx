/**
 * @file EditSupplierInfoStep.test.tsx
 *
 * @what_is_under_test EditSupplierInfoStep component
 * @responsibility Show read-only supplier name and editable contact fields
 * @out_of_scope React Hook Form schema validation logic
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import type { EditSupplierForm } from '../../../../../api/suppliers';
import type { SupplierRow } from '../../../../../api/suppliers/types';

import { EditSupplierInfoStep } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierInfoStep';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

const supplierFixture: SupplierRow = {
  id: 'supplier-1',
  name: 'Acme Corp',
  contactName: 'Janet Jones',
  phone: '555-4000',
  email: 'janet@acme.com',
  createdBy: 'owner@example.com',
  createdAt: '2023-01-01',
};

const renderWithForm = (
  selectedSupplier: SupplierRow | null,
  errors: FieldErrors<EditSupplierForm>,
  isSubmitting: boolean
) => {
  const Wrapper = () => {
    const { control } = useForm<EditSupplierForm>({
      defaultValues: {
        supplierId: '',
        contactName: '',
        phone: '',
        email: '',
      },
    });

    return (
      <EditSupplierInfoStep
        selectedSupplier={selectedSupplier}
        control={control}
        errors={errors}
        isSubmitting={isSubmitting}
      />
    );
  };

  return render(<Wrapper />);
};

describe('EditSupplierInfoStep', () => {
  it('shows guidance alert when no supplier is selected', () => {
    renderWithForm(null, {}, false);
    expect(screen.getByRole('alert')).toHaveTextContent('Search and select a supplier to enable editing.');
  });

  it('renders supplier name and editable contact fields when supplier is present', () => {
    renderWithForm(supplierFixture, {}, false);

    expect(screen.getByText('Step 2: Edit Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByLabelText('Contact Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('displays validation messages for each field when provided', () => {
    const errors: FieldErrors<EditSupplierForm> = {
      contactName: { type: 'manual', message: 'Contact required' },
      phone: { type: 'manual', message: 'Phone required' },
      email: { type: 'manual', message: 'Invalid email' },
    };

    renderWithForm(supplierFixture, errors, false);

    expect(screen.getByText('Contact required')).toBeInTheDocument();
    expect(screen.getByText('Phone required')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('disables inputs when submitting', () => {
    renderWithForm(supplierFixture, {}, true);

    expect(screen.getByLabelText('Contact Name')).toBeDisabled();
    expect(screen.getByLabelText('Phone')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });
});
