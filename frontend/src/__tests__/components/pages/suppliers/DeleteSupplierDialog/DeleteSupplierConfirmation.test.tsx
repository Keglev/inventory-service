/**
 * @file DeleteSupplierConfirmation.test.tsx
 *
 * @what_is_under_test DeleteSupplierConfirmation component
 * @responsibility Render supplier details, warnings, and handle confirmation actions
 * @out_of_scope Backend deletion API calls
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupplierRow } from '../../../../../api/suppliers/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { DeleteSupplierConfirmation } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierConfirmation';

const supplier: SupplierRow = {
  id: '1',
  name: 'Acme Corp',
  contactName: 'Alice',
  phone: '555-3210',
  email: 'alice@acme.com',
};

describe('DeleteSupplierConfirmation', () => {
  it('renders warning message and supplier details', () => {
    render(
      <DeleteSupplierConfirmation
        supplier={supplier}
        error={null}
        isDeleting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
    expect(
      screen.getByText('Are you sure do you want to delete this supplier? This cannot be reversed!')
    ).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@acme.com')).toBeInTheDocument();
    expect(screen.getByText('555-3210')).toBeInTheDocument();
  });

  it('hides optional fields when data missing', () => {
    const minimalSupplier: SupplierRow = { id: '2', name: 'No Contact Inc', contactName: null, phone: null, email: null };

    render(
      <DeleteSupplierConfirmation
        supplier={minimalSupplier}
        error={null}
        isDeleting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('No Contact Inc')).toBeInTheDocument();
    expect(screen.queryByText('Contact Name')).not.toBeInTheDocument();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Phone')).not.toBeInTheDocument();
  });

  it('displays backend error message when provided', () => {
    render(
      <DeleteSupplierConfirmation
        supplier={supplier}
        error={'Cannot delete supplier with linked items'}
        isDeleting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getAllByRole('alert')[1]).toHaveTextContent('Cannot delete supplier with linked items');
  });

  it('disables buttons and shows progress when deleting', () => {
    render(
      <DeleteSupplierConfirmation
        supplier={supplier}
        error={null}
        isDeleting={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled();
    const deletingButton = screen.getByRole('button', { name: 'Deleting...' });
    expect(deletingButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('invokes callbacks on confirm and cancel actions', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <DeleteSupplierConfirmation
        supplier={supplier}
        error={null}
        isDeleting={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Yes' }));
    await user.click(screen.getByRole('button', { name: 'No' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
