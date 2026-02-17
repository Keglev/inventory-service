/**
 * @file PriceChangeForm.test.tsx
 * @module __tests__/pages/inventory/dialogs/PriceChangeDialog/PriceChangeForm
 * @description
 * Contract tests for PriceChangeForm:
 * - Renders the three-step structure
 * - Enables/disables inputs based on supplier/item selection state
 * - Shows form-level errors and allows dismissing them
 * - Delegates supplier selection to state callbacks
 *
 * Notes:
 * - i18n is mocked for deterministic tests (no runtime init).
 * - Item details subcomponent is mocked to keep scope focused.
 * - We test behavior/contract rather than MUI internals.
 */

import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';

import type { UsePriceChangeFormReturn } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';
import { PriceChangeForm } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeForm';
import type { PriceChangeForm as PriceChangeFormValues } from '../../../../../api/inventory/validation';

/**
 * Translation is infrastructure. For deterministic unit tests, return keys.
 * We keep a tiny interpolation behavior for the helper text assertion.
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _fallback?: string, options?: Record<string, unknown>) => {
      if (key === 'inventory:price.priceChange' && options) {
        const from = String(options.from ?? '');
        const to = String(options.to ?? '');
        return `inventory:price.priceChange ${from} ${to}`;
      }
      return key;
    },
  }),
}));

/**
 * Mock item details to keep focus on form contract (not detail rendering).
 */
vi.mock('../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeItemDetails', () => ({
  PriceChangeItemDetails: ({
    item,
    currentPrice,
  }: {
    item: { name: string } | null;
    currentPrice: number;
  }) => (
    <div data-testid="item-details">
      {item ? `Item: ${item.name}` : 'No item selected'}
      {currentPrice > 0 ? ` Current Price: ${currentPrice}` : null}
    </div>
  ),
}));

type StateOverrides = Partial<
  Pick<
    UsePriceChangeFormReturn,
    | 'suppliers'
    | 'suppliersLoading'
    | 'selectedSupplier'
    | 'selectedItem'
    | 'effectiveCurrentPrice'
    | 'effectiveCurrentQty'
    | 'formError'
    | 'setFormError'
    | 'setSelectedSupplier'
  > & {
    formState: Partial<UsePriceChangeFormReturn['formState']>;
  }
>;

const makeState = (
  methods: ReturnType<typeof useForm<PriceChangeFormValues>>,
  overrides: StateOverrides = {},
): UsePriceChangeFormReturn => {
  const base: UsePriceChangeFormReturn = {
    control: methods.control,
    register: methods.register,
    formState: methods.formState,
    setValue: methods.setValue,
    setError: methods.setError,
    clearErrors: methods.clearErrors,
    handleSubmit: methods.handleSubmit,
    onSubmit: vi.fn(async () => {}),
    handleClose: vi.fn(),

    suppliers: [
      { id: '1', label: 'Supplier 1' },
      { id: '2', label: 'Supplier 2' },
    ],
    items: [],
    suppliersLoading: false,
    itemsLoading: false,
    itemDetailsLoading: false,
    effectiveCurrentPrice: 0,
    effectiveCurrentQty: 0,

    selectedSupplier: null,
    selectedItem: null,
    itemQuery: '',
    formError: null,

    setSelectedSupplier: vi.fn(),
    setSelectedItem: vi.fn(),
    setItemQuery: vi.fn(),
    setFormError: vi.fn(),
  };

  return {
    ...base,
    ...overrides,
    formState: overrides.formState ? { ...base.formState, ...overrides.formState } : base.formState,
  };
};

/**
 * Wrapper component so `useForm()` is called legally (Rules of Hooks).
 */
function PriceChangeFormHarness({ overrides }: { overrides?: StateOverrides }): ReactElement {
  const methods = useForm<PriceChangeFormValues>({
    defaultValues: { itemId: '', newPrice: 0 },
  });

  const state = makeState(methods, overrides);
  return <PriceChangeForm state={state} />;
}

const renderForm = (overrides: StateOverrides = {}) => render(<PriceChangeFormHarness overrides={overrides} />);

describe('PriceChangeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all three steps', () => {
    renderForm();

    expect(screen.getByText('inventory:steps.selectSupplier')).toBeInTheDocument();
    expect(screen.getByText('inventory:steps.selectItem')).toBeInTheDocument();
    expect(screen.getByText('inventory:steps.changePrice')).toBeInTheDocument();
  });

  it('renders supplier select dropdown', () => {
    renderForm();

    const supplierSelect = within(screen.getByTestId('supplier-form-control')).getByRole('combobox');
    expect(supplierSelect).toBeInTheDocument();
  });

  it('renders supplier options when opened', async () => {
    const user = userEvent.setup();
    renderForm();

    const supplierSelect = within(screen.getByTestId('supplier-form-control')).getByRole('combobox');
    await user.click(supplierSelect);

    expect(screen.getByText('Supplier 1')).toBeInTheDocument();
    expect(screen.getByText('Supplier 2')).toBeInTheDocument();
  });

  it('shows supplier control as disabled when loading', () => {
    renderForm({ suppliersLoading: true });

    const supplierSelect = within(screen.getByTestId('supplier-form-control')).getByRole('combobox');

    // MUI Select reports disabled via aria-disabled.
    expect(supplierSelect).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders Item autocomplete (disabled until supplier is selected)', () => {
    renderForm({ selectedSupplier: null });

    const itemInput = screen.getByPlaceholderText('inventory:search.selectSupplierFirst');
    expect(itemInput).toBeInTheDocument();
    expect(itemInput).toBeDisabled();
  });

  it('enables Item autocomplete when supplier is selected', () => {
    renderForm({ selectedSupplier: { id: '1', label: 'Supplier 1' } });

    const itemInput = screen.getByLabelText('inventory:search.searchSelectItem');
    expect(itemInput).toBeInTheDocument();
    expect(itemInput).toBeEnabled();
  });

  it('renders New Price field', () => {
    renderForm();

    expect(screen.getByLabelText('inventory:price.newPrice')).toBeInTheDocument();
  });

  it('disables New Price when no item is selected', () => {
    renderForm({ selectedItem: null });

    expect(screen.getByLabelText('inventory:price.newPrice')).toBeDisabled();
  });

  it('enables New Price when an item is selected', () => {
    renderForm({ selectedItem: { id: 'item1', name: 'Test Item', onHand: 100 } });

    expect(screen.getByLabelText('inventory:price.newPrice')).toBeEnabled();
  });

  it('displays form error when formError is set', () => {
    renderForm({ formError: 'Price change failed due to validation error' });

    expect(screen.getByText('Price change failed due to validation error')).toBeInTheDocument();
  });

  it('clears form error when the alert close button is clicked', async () => {
    const user = userEvent.setup();
    const setFormError = vi.fn();

    renderForm({ formError: 'Test error', setFormError });

    await user.click(screen.getByLabelText(/close/i));

    expect(setFormError).toHaveBeenCalledWith(null);
  });

  it('renders item details section when item is selected', () => {
    renderForm({
      selectedItem: { id: 'item1', name: 'Test Item', onHand: 100 },
      effectiveCurrentPrice: 50,
      effectiveCurrentQty: 100,
    });

    expect(screen.getByTestId('item-details')).toBeInTheDocument();
    expect(screen.getByText(/Item: Test Item/)).toBeInTheDocument();
  });

  it('updates selected supplier on dropdown change', async () => {
    const user = userEvent.setup();
    const setSelectedSupplier = vi.fn();

    renderForm({ setSelectedSupplier });

    const supplierSelect = within(screen.getByTestId('supplier-form-control')).getByRole('combobox');
    await user.click(supplierSelect);
    await user.click(screen.getByText('Supplier 1'));

    expect(setSelectedSupplier).toHaveBeenCalled();
  });

  it('shows price-change helper text when item is selected and new price is entered', async () => {
    const user = userEvent.setup();

    renderForm({
      selectedItem: { id: 'item1', name: 'Test Item', onHand: 100 },
      effectiveCurrentPrice: 50,
    });

    const newPriceInput = screen.getByLabelText('inventory:price.newPrice');
    await user.clear(newPriceInput);
    await user.type(newPriceInput, '75');

    expect(screen.getByText(/inventory:price\.priceChange/)).toBeInTheDocument();
  });

  it('handles multiple suppliers in dropdown', async () => {
    const user = userEvent.setup();

    renderForm({
      suppliers: [
        { id: '1', label: 'Supplier A' },
        { id: '2', label: 'Supplier B' },
        { id: '3', label: 'Supplier C' },
      ],
    });

    const supplierSelect = within(screen.getByTestId('supplier-form-control')).getByRole('combobox');
    await user.click(supplierSelect);

    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
    expect(screen.getByText('Supplier C')).toBeInTheDocument();
  });
});
