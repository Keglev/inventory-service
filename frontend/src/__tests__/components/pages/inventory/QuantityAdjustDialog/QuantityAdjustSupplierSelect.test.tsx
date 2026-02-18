/**
 * @file QuantityAdjustSupplierSelect.test.tsx
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/QuantityAdjustSupplierSelect
 * @description Contract tests for QuantityAdjustSupplierSelect:
 * - Renders the supplier step UI.
 * - Emits the selected supplier via callback.
 * - Disables selection while suppliers are loading.
 *
 * Out of scope:
 * - Supplier fetching (react-query).
 * - MUI Select implementation details.
 */

// Shared deterministic mocks (i18n + toast) for this folder.
import './testSetup';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityAdjustSupplierSelect } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustSupplierSelect';
import type { SupplierOption } from '../../../../../api/analytics/types';

// Stable options for deterministic UI assertions.
const suppliers: SupplierOption[] = [
  { id: 'sup-1', label: 'Supplier One' },
  { id: 'sup-2', label: 'Supplier Two' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuantityAdjustSupplierSelect', () => {
  it('renders step title and supplier options', async () => {
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
    const combo = screen.getByRole('combobox');
    await user.click(combo);

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

    const combo = screen.getByRole('combobox');
    await user.click(combo);
    await user.click(await screen.findByRole('option', { name: 'Supplier Two' }));

    expect(onSupplierChange).toHaveBeenCalledWith(suppliers[1]);
  });

  it('disables selection while loading suppliers', () => {
    render(
      <QuantityAdjustSupplierSelect
        selectedSupplier={null}
        onSupplierChange={vi.fn()}
        suppliers={suppliers}
        loading={true}
      />
    );

    const combo = screen.getByRole('combobox');
    expect(combo).toHaveAttribute('aria-disabled', 'true');
  });

  it('clears selection when empty option chosen', async () => {
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

    const combo = screen.getByRole('combobox');
    await user.click(combo);
    await user.click(await screen.findByRole('option', { name: 'Select an option' }));

    expect(onSupplierChange).toHaveBeenCalledWith(null);
  });
});
