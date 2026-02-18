/**
 * @file QuantityAdjustForm.test.tsx
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/QuantityAdjustForm
 * @description Contract tests for QuantityAdjustForm:
 * - Forwards orchestrator state to step subcomponents.
 * - Surfaces disabled/enabled behavior required by the dialog workflow.
 * - Shows and dismisses form-level errors.
 *
 * Out of scope:
 * - Subcomponent rendering (SupplierSelect/ItemSelect/Details/QuantityInput).
 * - react-hook-form validation schema behavior.
 * - MUI internals.
 */

// Shared deterministic mocks (i18n + toast) for this folder.
import './testSetup';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseQuantityAdjustFormReturn } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm';
import type { SupplierOption, ItemOption } from '../../../../../api/analytics/types';
import { itemOption, makeQuantityAdjustForm, supplierOption } from './fixtures';

// Spies capture the props passed to each step component.
const supplierSelectSpy = vi.fn();
const itemSelectSpy = vi.fn();
const itemDetailsSpy = vi.fn();
const quantityInputSpy = vi.fn();

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustSupplierSelect', () => ({
  QuantityAdjustSupplierSelect: (props: unknown) => {
    // Stub leaf component to keep this test focused on orchestration/prop wiring.
    supplierSelectSpy(props);
    return <div data-testid="supplier-select">Supplier Select</div>;
  },
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemSelect', () => ({
  QuantityAdjustItemSelect: (props: unknown) => {
    // Stub leaf component to keep this test focused on orchestration/prop wiring.
    itemSelectSpy(props);
    return <div data-testid="item-select">Item Select</div>;
  },
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemDetails', () => ({
  QuantityAdjustItemDetails: (props: unknown) => {
    // Stub leaf component to keep this test focused on orchestration/prop wiring.
    itemDetailsSpy(props);
    return <div data-testid="item-details">Item Details</div>;
  },
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustQuantityInput', () => ({
  QuantityAdjustQuantityInput: (props: unknown) => {
    // Stub leaf component to keep this test focused on orchestration/prop wiring.
    quantityInputSpy(props);
    return <div data-testid="quantity-input">Quantity Input</div>;
  },
}));

import { QuantityAdjustForm } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustForm';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuantityAdjustForm', () => {
  it('passes supplier props to QuantityAdjustSupplierSelect', () => {
    const form = makeQuantityAdjustForm({
      selectedSupplier: supplierOption,
      suppliers: [supplierOption],
      suppliersLoading: true,
    });

    render(<QuantityAdjustForm form={form} />);

    expect(screen.getByTestId('supplier-select')).toBeInTheDocument();
    const props = supplierSelectSpy.mock.calls[0][0] as {
      selectedSupplier: SupplierOption | null;
      suppliers: SupplierOption[] | undefined;
      loading: boolean;
      onSupplierChange: UseQuantityAdjustFormReturn['setSelectedSupplier'];
    };
    expect(props.selectedSupplier).toBe(supplierOption);
    expect(props.suppliers).toEqual([supplierOption]);
    expect(props.loading).toBe(true);
    expect(props.onSupplierChange).toBe(form.setSelectedSupplier);
  });

  it('forwards item selection props with supplier context', () => {
    const form = makeQuantityAdjustForm({
      selectedSupplier: supplierOption,
      selectedItem: itemOption,
      itemQuery: 'widget',
      items: [itemOption],
      itemsLoading: true,
    });

    render(<QuantityAdjustForm form={form} />);

    expect(screen.getByTestId('item-select')).toBeInTheDocument();
    const props = itemSelectSpy.mock.calls[0][0] as {
      selectedItem: ItemOption | null;
      selectedSupplier: SupplierOption | null;
      searchQuery: string;
      items: ItemOption[] | undefined;
      loading: boolean;
      onItemChange: UseQuantityAdjustFormReturn['setSelectedItem'];
      onSearchChange: UseQuantityAdjustFormReturn['setItemQuery'];
    };
    expect(props.selectedItem).toBe(itemOption);
    expect(props.selectedSupplier).toBe(supplierOption);
    expect(props.searchQuery).toBe('widget');
    expect(props.items).toEqual([itemOption]);
    expect(props.loading).toBe(true);
    expect(props.onItemChange).toBe(form.setSelectedItem);
    expect(props.onSearchChange).toBe(form.setItemQuery);
  });

  it('provides current quantity and price to item details panel', () => {
    const form = makeQuantityAdjustForm({
      selectedItem: itemOption,
      effectiveCurrentQty: 12,
      effectiveCurrentPrice: 14.5,
      itemDetailsLoading: false,
    });

    render(<QuantityAdjustForm form={form} />);

    expect(screen.getByTestId('item-details')).toBeInTheDocument();
    const props = itemDetailsSpy.mock.calls[0][0] as {
      item: ItemOption | null;
      currentQty: number;
      currentPrice: number | null;
      loading: boolean;
    };
    expect(props.item).toBe(itemOption);
    expect(props.currentQty).toBe(12);
    expect(props.currentPrice).toBe(14.5);
    expect(props.loading).toBe(false);
  });

  it('disables quantity input until item selected', () => {
    const form = makeQuantityAdjustForm({ selectedItem: null, effectiveCurrentQty: 0 });

    render(<QuantityAdjustForm form={form} />);

    const props = quantityInputSpy.mock.calls[0][0] as { disabled: boolean; currentQty: number };
    expect(props.disabled).toBe(true);
    expect(props.currentQty).toBe(0);
  });

  it('enables quantity input once item exists and shares control props', () => {
    const form = makeQuantityAdjustForm({
      selectedItem: itemOption,
      effectiveCurrentQty: 8,
      control: { mock: true } as unknown as UseQuantityAdjustFormReturn['control'],
      formState: { errors: { newQuantity: { message: 'Required' } }, isSubmitting: false } as UseQuantityAdjustFormReturn['formState'],
    });

    render(<QuantityAdjustForm form={form} />);

    const props = quantityInputSpy.mock.calls[0][0] as {
      disabled: boolean;
      control: UseQuantityAdjustFormReturn['control'];
      errors: UseQuantityAdjustFormReturn['formState']['errors'];
      currentQty: number;
    };
    expect(props.disabled).toBe(false);
    expect(props.control).toBe(form.control);
    expect(props.errors).toBe(form.formState.errors);
    expect(props.currentQty).toBe(8);
  });

  it('renders alert with error message and clears on close', async () => {
    const user = userEvent.setup();
    const form = makeQuantityAdjustForm({ formError: 'Quantity update failed' });

    render(<QuantityAdjustForm form={form} />);

    expect(screen.getByText('Quantity update failed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(form.setFormError).toHaveBeenCalledWith('');
  });
});
