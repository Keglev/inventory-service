/**
 * @file EditSupplierConfirmation.test.tsx
 *
 * @what_is_under_test EditSupplierConfirmation component
 * @responsibility Confirm pending supplier changes before submission
 * @out_of_scope updateSupplier API interaction
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { EditSupplierForm } from '../../../../../api/suppliers';
import type { SupplierRow } from '../../../../../api/suppliers/types';

import { EditSupplierConfirmation } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierConfirmation';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

const supplier: SupplierRow = {
  id: 'supplier-1',
  name: 'Acme Corp',
  contactName: 'Old Contact',
  phone: '555-5000',
  email: 'old@acme.com',
  createdBy: 'owner@example.com',
  createdAt: '2023-01-01',
};

const changes: EditSupplierForm = {
  supplierId: 'supplier-1',
  contactName: 'New Contact',
  phone: '555-6000',
  email: 'new@acme.com',
};

describe('EditSupplierConfirmation', () => {
  it('renders supplier details and change summary when open', () => {
    render(
      <EditSupplierConfirmation
        open={true}
        supplier={supplier}
        changes={changes}
        formError=""
        isSubmitting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Confirm Changes' })).toBeInTheDocument();
    expect(screen.getByText('Supplier Name')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Contact Name')).toBeInTheDocument();
    expect(screen.getByText('Old Contact → New Contact')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('555-5000 → 555-6000')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('old@acme.com → new@acme.com')).toBeInTheDocument();
  });

  it('invokes callbacks when cancel or confirm buttons are pressed', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <EditSupplierConfirmation
        open={true}
        supplier={supplier}
        changes={changes}
        formError=""
        isSubmitting={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'No' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders error alert and delegates close action to onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <EditSupplierConfirmation
        open={true}
        supplier={supplier}
        changes={changes}
        formError="Failed to update supplier"
        isSubmitting={false}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );

    const alerts = screen.getAllByRole('alert');
    const errorAlert = alerts.find((alert) =>
      within(alert).queryByText('Failed to update supplier')
    );

    expect(errorAlert).toBeDefined();
    expect(within(errorAlert!).getByText('Failed to update supplier')).toBeInTheDocument();

    const closeButton = within(errorAlert!).getByLabelText('Close');
    await user.click(closeButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables confirm action and shows saving indicator while submitting', () => {
    render(
      <EditSupplierConfirmation
        open={true}
        supplier={supplier}
        changes={changes}
        formError=""
        isSubmitting={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const confirmButton = screen.getByRole('button', { name: 'Saving...' });
    expect(confirmButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('hides change summary boxes when values are unchanged', () => {
    const unchanged: EditSupplierForm = {
      supplierId: 'supplier-1',
      contactName: supplier.contactName ?? '',
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
    };

    render(
      <EditSupplierConfirmation
        open={true}
        supplier={supplier}
        changes={unchanged}
        formError=""
        isSubmitting={false}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByText('Old Contact →')).not.toBeInTheDocument();
    expect(screen.queryByText('555-5000 →')).not.toBeInTheDocument();
    expect(screen.queryByText('old@acme.com →')).not.toBeInTheDocument();
  });
});
