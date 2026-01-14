/**
 * @file QuantityAdjustSupplierSelect.test.tsx
 *
 * @what_is_under_test QuantityAdjustSupplierSelect component
 * @responsibility Render supplier dropdown and surface selection callbacks
 * @out_of_scope Query orchestration, supplier fetching
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityAdjustSupplierSelect } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustSupplierSelect';
import type { SupplierOption } from '../../../../../api/analytics/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

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
