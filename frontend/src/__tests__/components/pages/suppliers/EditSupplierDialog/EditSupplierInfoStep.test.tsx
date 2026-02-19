/**
 * @file EditSupplierInfoStep.test.tsx
 * @module __tests__/components/pages/suppliers/EditSupplierDialog/EditSupplierInfoStep
 * @description Contract tests for the `EditSupplierInfoStep` presentation component.
 *
 * Contract under test:
 * - When no supplier is selected, renders an informational alert.
 * - When a supplier is selected, renders supplier identity (read-only) and the editable inputs.
 * - Surfaces react-hook-form field errors as helper text.
 * - Disables inputs while submitting.
 *
 * Out of scope:
 * - Schema validation rules and resolver behavior.
 * - MUI layout/styling (assert roles/labels/text only).
 *
 * Test strategy:
 * - Provide a real RHF `control` from `useForm` to keep tests aligned with integration usage.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import type { EditSupplierForm } from '../../../../../api/suppliers';
import type { SupplierRow } from '../../../../../api/suppliers/types';

import { EditSupplierInfoStep } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierInfoStep';
import { supplierRow } from './fixtures';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

const supplierFixture: SupplierRow = supplierRow({
  contactName: 'Janet Jones',
  phone: '555-4000',
  email: 'janet@acme.com',
});

type RenderOverrides = {
  selectedSupplier?: SupplierRow | null;
  errors?: FieldErrors<EditSupplierForm>;
  isSubmitting?: boolean;
};

const renderWithForm = ({
  selectedSupplier = supplierFixture,
  errors = {},
  isSubmitting = false,
}: RenderOverrides) => {
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
    renderWithForm({ selectedSupplier: null });
    expect(screen.getByRole('alert')).toHaveTextContent('Search and select a supplier to enable editing.');
  });

  it('renders supplier name and editable contact fields when supplier is present', () => {
    renderWithForm({});

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

    renderWithForm({ errors });

    expect(screen.getByText('Contact required')).toBeInTheDocument();
    expect(screen.getByText('Phone required')).toBeInTheDocument();
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('disables inputs when submitting', () => {
    renderWithForm({ isSubmitting: true });

    expect(screen.getByLabelText('Contact Name')).toBeDisabled();
    expect(screen.getByLabelText('Phone')).toBeDisabled();
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });
});
