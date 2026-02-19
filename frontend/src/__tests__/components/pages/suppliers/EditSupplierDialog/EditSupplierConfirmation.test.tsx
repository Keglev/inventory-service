/**
 * @file EditSupplierConfirmation.test.tsx
 * @module __tests__/components/pages/suppliers/EditSupplierDialog/EditSupplierConfirmation
 * @description Contract tests for the `EditSupplierConfirmation` presentation component.
 *
 * Contract under test:
 * - Renders a confirmation dialog with supplier identity (name) and a summary of changed fields.
 * - Delegates user intent via callbacks: `onCancel` and `onConfirm`.
 * - Reflects submission state by disabling actions and showing a progress indicator.
 * - Surfaces `formError` in an alert and delegates alert close to `onCancel`.
 *
 * Out of scope:
 * - API interaction (handled by the orchestration hook).
 * - MUI styling/structure beyond accessible roles and text.
 *
 * Test strategy:
 * - Assert observable text and a11y roles.
 * - Verify callbacks, not internal layout.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { EditSupplierForm } from '../../../../../api/suppliers';
import type { SupplierRow } from '../../../../../api/suppliers/types';

import { EditSupplierConfirmation } from '../../../../../pages/suppliers/dialogs/EditSupplierDialog/EditSupplierConfirmation';
import { editSupplierChanges, supplierRow } from './fixtures';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

const supplier: SupplierRow = supplierRow();
const changes: EditSupplierForm = editSupplierChanges();

type RenderOverrides = Partial<React.ComponentProps<typeof EditSupplierConfirmation>>;

const renderConfirmation = (overrides: RenderOverrides = {}) =>
  render(
    <EditSupplierConfirmation
      open={true}
      supplier={supplier}
      changes={changes}
      formError=""
      isSubmitting={false}
      onConfirm={vi.fn()}
      onCancel={vi.fn()}
      {...overrides}
    />
  );

describe('EditSupplierConfirmation', () => {
  it('renders supplier details and change summary when open', () => {
    renderConfirmation();

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

    renderConfirmation({ onConfirm, onCancel });

    await user.click(screen.getByRole('button', { name: 'No' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Yes' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders error alert and delegates close action to onCancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderConfirmation({ formError: 'Failed to update supplier', onCancel });

    const message = screen.getByText('Failed to update supplier');
    const errorAlert = message.closest('[role="alert"]');
    expect(errorAlert).not.toBeNull();

    const closeButton = within(errorAlert as HTMLElement).getByLabelText('Close');
    await user.click(closeButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables confirm action and shows saving indicator while submitting', () => {
    renderConfirmation({ isSubmitting: true });

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

    renderConfirmation({ changes: unchanged });

    expect(screen.queryByText('Old Contact →')).not.toBeInTheDocument();
    expect(screen.queryByText('555-5000 →')).not.toBeInTheDocument();
    expect(screen.queryByText('old@acme.com →')).not.toBeInTheDocument();
  });
});
