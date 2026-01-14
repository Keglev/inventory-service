/**
 * @file QuantityAdjustItemSelect.test.tsx
 *
 * @what_is_under_test QuantityAdjustItemSelect component
 * @responsibility Provide searchable autocomplete for item selection
 * @out_of_scope Data fetching, supplier synchronization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityAdjustItemSelect } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemSelect';
import type { ItemOption, SupplierOption } from '../../../../../api/analytics/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

const supplier: SupplierOption = { id: 'sup-1', label: 'Supplier One' };
const items: ItemOption[] = [
  { id: 'item-1', name: 'Surgical Gloves', supplierId: 'sup-1', onHand: 10 },
  { id: 'item-2', name: 'Face Mask', supplierId: 'sup-1', onHand: 50 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuantityAdjustItemSelect', () => {
  it('renders disabled state with placeholder until supplier selected', () => {
    render(
      <QuantityAdjustItemSelect
        selectedItem={null}
        onItemChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        items={items}
        loading={false}
        selectedSupplier={null}
      />
    );

    expect(screen.getByText('Step 2: Select Item')).toBeInTheDocument();
    const input = screen.getByRole('combobox');
    expect(input).toBeDisabled();
    expect(screen.getByPlaceholderText('Select supplier first')).toBeInTheDocument();
  });

  it('calls onSearchChange as the user types', () => {
    const onSearchChange = vi.fn();

    render(
      <QuantityAdjustItemSelect
        selectedItem={null}
        onItemChange={vi.fn()}
        searchQuery=""
        onSearchChange={onSearchChange}
        items={items}
        loading={false}
        selectedSupplier={supplier}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Gl' } });

    expect(onSearchChange).toHaveBeenLastCalledWith('Gl');
  });

  it('invokes onItemChange when an option is selected', async () => {
    const onItemChange = vi.fn();
    const user = userEvent.setup();

    render(
      <QuantityAdjustItemSelect
        selectedItem={null}
        onItemChange={onItemChange}
        searchQuery=""
        onSearchChange={vi.fn()}
        items={items}
        loading={false}
        selectedSupplier={supplier}
      />
    );

    const input = screen.getByRole('combobox');
    await user.click(input);

    const option = await screen.findByText('Surgical Gloves');
    await user.click(option);

    expect(onItemChange).toHaveBeenCalledWith(items[0]);
  });

  it('shows loading indicator while fetching items', () => {
    render(
      <QuantityAdjustItemSelect
        selectedItem={null}
        onItemChange={vi.fn()}
        searchQuery=""
        onSearchChange={vi.fn()}
        items={[]}
        loading={true}
        selectedSupplier={supplier}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
