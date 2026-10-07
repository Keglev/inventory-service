/**
 * @file QuantityAdjustItemSelect.test.tsx
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/QuantityAdjustItemSelect
 * @description Contract tests for QuantityAdjustItemSelect:
 * - Disabled until a supplier is selected.
 * - Calls onSearchChange as the user types.
 * - Calls onItemChange when an item option is chosen.
 * - Says the list is loading while it loads.
 *
 * Out of scope:
 * - Item search query orchestration.
 * - The shared field's own contract (ListSearchField.test, ItemSearchField.test).
 */

// Shared deterministic mocks (i18n + toast) for this folder.
import './testSetup';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityAdjustItemSelect } from '@/pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemSelect';
import type { ItemOption, SupplierOption } from '@/api/analytics/types';

const supplier: SupplierOption = { id: 'sup-1', label: 'Supplier One' };

// Stable item options keep tests deterministic.
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
    expect(screen.getByPlaceholderText('Please select a supplier first to enable searching.')).toBeInTheDocument();
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
        searchQuery="gl"
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

  it('says the list is loading while the items load', async () => {
    const user = userEvent.setup();
    render(
      <QuantityAdjustItemSelect
        selectedItem={null}
        onItemChange={vi.fn()}
        searchQuery="gl"
        onSearchChange={vi.fn()}
        items={[]}
        loading={true}
        selectedSupplier={supplier}
      />
    );
    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeEnabled();
  });

  it('asks for two characters before searching and reports an empty result after', async () => {
    const user = userEvent.setup();
    const props = {
      selectedItem: null,
      onItemChange: vi.fn(),
      onSearchChange: vi.fn(),
      items: [],
      loading: false,
      selectedSupplier: supplier,
    };

    const { rerender } = render(<QuantityAdjustItemSelect {...props} searchQuery="G" />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('Enter at least 2 characters to search')).toBeInTheDocument();

    rerender(<QuantityAdjustItemSelect {...props} searchQuery="Gl" />);
    expect(screen.getByText('No items found for this search.')).toBeInTheDocument();
  });

  it('shows no options while the item list has not loaded', async () => {
    const user = userEvent.setup();

    render(
      <QuantityAdjustItemSelect
        selectedItem={null}
        onItemChange={vi.fn()}
        searchQuery="gl"
        onSearchChange={vi.fn()}
        items={undefined}
        loading={false}
        selectedSupplier={supplier}
      />
    );
    await user.click(screen.getByRole('combobox'));

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No items found for this search.')).toBeInTheDocument();
  });
});
