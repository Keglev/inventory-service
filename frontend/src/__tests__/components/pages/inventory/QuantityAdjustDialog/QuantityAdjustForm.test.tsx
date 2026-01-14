/**
 * @file QuantityAdjustForm.test.tsx
 *
 * @what_is_under_test QuantityAdjustForm component
 * @responsibility Render form steps and surface orchestrator props to child components
 * @out_of_scope Child component internals and form submission
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseQuantityAdjustFormReturn } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm';
import type { SupplierOption, ItemOption } from '../../../../../api/analytics/types';

const supplierSelectSpy = vi.fn();
const itemSelectSpy = vi.fn();
const itemDetailsSpy = vi.fn();
const quantityInputSpy = vi.fn();

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustSupplierSelect', () => ({
  QuantityAdjustSupplierSelect: (props: unknown) => {
    supplierSelectSpy(props);
    return <div data-testid="supplier-select">Supplier Select</div>;
  },
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemSelect', () => ({
  QuantityAdjustItemSelect: (props: unknown) => {
    itemSelectSpy(props);
    return <div data-testid="item-select">Item Select</div>;
  },
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustItemDetails', () => ({
  QuantityAdjustItemDetails: (props: unknown) => {
    itemDetailsSpy(props);
    return <div data-testid="item-details">Item Details</div>;
  },
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustQuantityInput', () => ({
  QuantityAdjustQuantityInput: (props: unknown) => {
    quantityInputSpy(props);
    return <div data-testid="quantity-input">Quantity Input</div>;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { QuantityAdjustForm } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustForm';

const supplierOption: SupplierOption = { id: 'sup-1', label: 'Supplier One' };
const itemOption: ItemOption = { id: 'item-1', name: 'Item One', onHand: 5, price: 9.99 };

const createForm = (
  overrides: Partial<UseQuantityAdjustFormReturn> = {}
): UseQuantityAdjustFormReturn => ({
  selectedSupplier: null,
  selectedItem: null,
  itemQuery: '',
  formError: '',
  setSelectedSupplier: vi.fn(),
  setSelectedItem: vi.fn(),
  setItemQuery: vi.fn(),
  setFormError: vi.fn(),
  suppliers: [],
  suppliersLoading: false,
  items: [],
  itemsLoading: false,
  effectiveCurrentQty: 0,
  effectiveCurrentPrice: null,
  itemDetailsLoading: false,
  control: {} as UseQuantityAdjustFormReturn['control'],
  formState: { errors: {}, isSubmitting: false } as UseQuantityAdjustFormReturn['formState'],
  setValue: vi.fn(),
  onSubmit: vi.fn(),
  handleClose: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuantityAdjustForm', () => {
  it('passes supplier props to QuantityAdjustSupplierSelect', () => {
    const form = createForm({
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
    const form = createForm({
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
    const form = createForm({
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
    const form = createForm({ selectedItem: null, effectiveCurrentQty: 0 });

    render(<QuantityAdjustForm form={form} />);

    const props = quantityInputSpy.mock.calls[0][0] as { disabled: boolean; currentQty: number };
    expect(props.disabled).toBe(true);
    expect(props.currentQty).toBe(0);
  });

  it('enables quantity input once item exists and shares control props', () => {
    const form = createForm({
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
    const form = createForm({ formError: 'Quantity update failed' });

    render(<QuantityAdjustForm form={form} />);

    expect(screen.getByText('Quantity update failed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(form.setFormError).toHaveBeenCalledWith('');
  });
});
