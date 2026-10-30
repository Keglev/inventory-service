/**
 * @file QuantityAdjustSupplierSelect.test.tsx
 * @module __tests__/pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustSupplierSelect
 * @description Contract tests for QuantityAdjustSupplierSelect:
 * - Renders the supplier step UI.
 * - Typing two letters lists the matching suppliers (S2-9); a pick is emitted.
 * - The field stays enabled while suppliers load; clearing emits null.
 *
 * Out of scope:
 * - Supplier fetching (react-query).
 * - SupplierPickerField internals (its own spec).
 */

// Shared deterministic mocks (i18n + toast) for this folder.
import '@/__tests__/pages/inventory/dialogs/QuantityAdjustDialog/testSetup';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityAdjustSupplierSelect } from '@/pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustSupplierSelect';
import type { SupplierOption } from '@/api/analytics/types';

// Stable options for deterministic UI assertions.
const suppliers: SupplierOption[] = [
  { id: 'sup-1', label: 'Supplier One' },
  { id: 'sup-2', label: 'Supplier Two' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuantityAdjustSupplierSelect', () => {
  it('renders the step title and lists suppliers after typing', async () => {
    const user = userEvent.setup();

    render(
      <QuantityAdjustSupplierSelect
        selectedSupplier={null}
        onSupplierChange={vi.fn()}
        suppliers={suppliers}
        loading={false}
      />
    );

    expect(screen.getByText('Step 1: Select Supplier')).toBeInTheDocument();
    await user.type(screen.getByRole('combobox', { name: 'Supplier' }), 'Supplier');

    expect(await screen.findByRole('option', { name: 'Supplier One' })).toBeInTheDocument();
    expect(await screen.findByRole('option', { name: 'Supplier Two' })).toBeInTheDocument();
  });

  it('invokes onSupplierChange with chosen supplier', async () => {
    const onSupplierChange = vi.fn();
    const user = userEvent.setup();

    render(
      <QuantityAdjustSupplierSelect
        selectedSupplier={null}
        onSupplierChange={onSupplierChange}
        suppliers={suppliers}
        loading={false}
      />
    );

    await user.type(screen.getByRole('combobox', { name: 'Supplier' }), 'two');
    await user.click(await screen.findByRole('option', { name: 'Supplier Two' }));

    expect(onSupplierChange).toHaveBeenCalledWith(suppliers[1]);
  });

  it('keeps the field enabled while suppliers load', () => {
    render(
      <QuantityAdjustSupplierSelect
        selectedSupplier={null}
        onSupplierChange={vi.fn()}
        suppliers={suppliers}
        loading={true}
      />
    );

    expect(screen.getByRole('combobox', { name: 'Supplier' })).toBeEnabled();
  });

  it('clears the selection when the field is emptied', async () => {
    const onSupplierChange = vi.fn();
    const user = userEvent.setup();

    render(
      <QuantityAdjustSupplierSelect
        selectedSupplier={suppliers[0]}
        onSupplierChange={onSupplierChange}
        suppliers={suppliers}
        loading={false}
      />
    );

    await user.clear(screen.getByRole('combobox', { name: 'Supplier' }));

    expect(onSupplierChange).toHaveBeenCalledWith(null);
  });
});
