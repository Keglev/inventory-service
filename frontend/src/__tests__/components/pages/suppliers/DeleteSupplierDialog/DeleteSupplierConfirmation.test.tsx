/**
 * @file DeleteSupplierConfirmation.test.tsx
 * @module __tests__/components/pages/suppliers/DeleteSupplierDialog/DeleteSupplierConfirmation
 * @description Contract tests for the DeleteSupplierConfirmation step component.
 *
 * Contract under test:
 * - Renders a warning prompt requiring explicit confirmation.
 * - Displays supplier name and any available optional details (contactName, email, phone).
 * - Hides optional detail rows when values are null/empty.
 * - Displays a backend error banner when `error` is provided.
 * - While deleting, disables actions and shows progress with a "Deleting..." label.
 * - Delegates user intent via `onConfirm` / `onCancel` callbacks.
 *
 * Out of scope:
 * - Backend delete API orchestration (tested at workflow hook level).
 * - MUI internals; assertions are against visible text/roles and callback wiring.
 *
 * Test strategy:
 * - i18n is mocked to return fallback/defaultValue for deterministic strings.
 * - Use a centralized render helper to keep tests concise and consistent.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import type { SupplierRow } from '../../../../../api/suppliers/types';

vi.mock('react-i18next', () => ({
  // Prefer fallback/defaultValue so assertions don't depend on translation files.
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

// -------------------------------------
// Test helpers
// -------------------------------------
const renderConfirmation = (
  overrides?: Partial<ComponentProps<typeof DeleteSupplierConfirmation>>
) => {
  const props: ComponentProps<typeof DeleteSupplierConfirmation> = {
    supplier,
    error: null,
    isDeleting: false,
    onConfirm: vi.fn(async () => undefined),
    onCancel: vi.fn(),
    ...overrides,
  };

  render(<DeleteSupplierConfirmation {...props} />);
  return props;
};

describe('DeleteSupplierConfirmation', () => {
  it('renders warning message and supplier details', () => {
    renderConfirmation();

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
    const minimalSupplier: SupplierRow = {
      id: '2',
      name: 'No Contact Inc',
      contactName: null,
      phone: null,
      email: null,
    };

    renderConfirmation({ supplier: minimalSupplier });

    expect(screen.getByText('No Contact Inc')).toBeInTheDocument();
    expect(screen.queryByText('Contact Name')).not.toBeInTheDocument();
    expect(screen.queryByText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText('Phone')).not.toBeInTheDocument();
  });

  it('displays backend error message when provided', () => {
    const message = 'Cannot delete supplier with linked items';
    renderConfirmation({ error: message });

    // Avoid brittle alert indexing: assert the message is present and lives inside an alert.
    const textNode = screen.getByText(message);
    expect(textNode.closest('[role="alert"]')).not.toBeNull();
  });

  it('disables buttons and shows progress when deleting', () => {
    renderConfirmation({ isDeleting: true });

    expect(screen.getByRole('button', { name: 'No' })).toBeDisabled();
    const deletingButton = screen.getByRole('button', { name: 'Deleting...' });
    expect(deletingButton).toBeDisabled();

    // `CircularProgress` exposes `role=progressbar`.
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('invokes callbacks on confirm and cancel actions', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn(async () => undefined);
    const onCancel = vi.fn();

    renderConfirmation({ onConfirm, onCancel });

    await user.click(screen.getByRole('button', { name: 'Yes' }));
    await user.click(screen.getByRole('button', { name: 'No' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
