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
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';

import type { UsePriceChangeFormReturn } from '@/pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';
import { PriceChangeForm } from '@/pages/inventory/dialogs/PriceChangeDialog/PriceChangeForm';
import type { PriceChangeForm as PriceChangeFormValues } from '@/pages/inventory/validation/inventoryValidation';

/**
 * Translation is infrastructure. For deterministic unit tests, return keys.
 * We keep a tiny interpolation behavior for the helper text assertion.
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // i18next's signature is t(key, options); the interpolated values are
    // appended so the helper text's formatting can be asserted.
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${Object.values(options).join(' ')}` : key,
  }),
}));

/**
 * Mock item details to keep focus on form contract (not detail rendering).
 */
const detailsSpy = vi.hoisted(() => vi.fn());
vi.mock('@/pages/inventory/dialogs/SelectedItemDetails', () => ({
  SelectedItemDetails: (props: { item: { name: string } | null; currentPrice: number }) => {
    detailsSpy(props);
    return (
      <div data-testid="item-details">
        {props.item ? `Item: ${props.item.name}` : 'No item selected'}
        {props.currentPrice > 0 ? ` Current Price: ${props.currentPrice}` : null}
      </div>
    );
  },
}));

// German number format, so the helper text shows what a German user sees.
vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { numberFormat: 'DE', dateFormat: 'DD.MM.YYYY', tableDensity: 'standard' },
  }),
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
    formState: methods.formState,
    setValue: methods.setValue,
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
    formError: '',

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

  // S2-9: the supplier is searched (two letters), not picked from a full dropdown.
  it('renders the supplier search field', () => {
    renderForm();

    expect(screen.getByRole('combobox', { name: 'inventory:table.supplier' })).toHaveValue('');
  });

  it('lists the matching suppliers after two letters', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByRole('combobox', { name: 'inventory:table.supplier' }), 'er 2');

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Supplier 2']);
  });

  it('keeps the supplier field enabled while suppliers load', () => {
    renderForm({ suppliersLoading: true });

    expect(screen.getByRole('combobox', { name: 'inventory:table.supplier' })).toBeEnabled();
  });

  it('renders Item autocomplete (disabled until supplier is selected)', () => {
    renderForm({ selectedSupplier: null });

    const itemInput = screen.getByPlaceholderText('inventory:search.selectSupplierFirst');
    expect(itemInput).toBeInTheDocument();
    expect(itemInput).toBeDisabled();
  });

  it('enables Item autocomplete when supplier is selected', () => {
    renderForm({ selectedSupplier: { id: '1', label: 'Supplier 1' } });

    const itemInput = screen.getByLabelText('inventory:item');
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

    expect(setFormError).toHaveBeenCalledWith('');
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

  it('hands the picked supplier to the state', async () => {
    const user = userEvent.setup();
    const setSelectedSupplier = vi.fn();

    renderForm({ setSelectedSupplier });

    await user.type(screen.getByRole('combobox', { name: 'inventory:table.supplier' }), 'Supplier');
    await user.click(screen.getByRole('option', { name: 'Supplier 1' }));

    expect(setSelectedSupplier).toHaveBeenCalledWith({ id: '1', label: 'Supplier 1' });
  });

  it('shows price-change helper text when item is selected and new price is entered', async () => {
    const user = userEvent.setup();

    renderForm({
      selectedItem: { id: 'item1', name: 'Test Item', onHand: 100 },
      effectiveCurrentPrice: 50,
      effectiveCurrentQty: 100,
    });

    const newPriceInput = screen.getByLabelText('inventory:price.newPrice');
    await user.clear(newPriceInput);
    await user.type(newPriceInput, '75');

    // Prices in the user's number format with a Euro suffix, as in the panel.
    expect(
      screen.getByText(
        'inventory:price.priceChange 50,00 € 75,00 € · inventory:price.newTotalValue 7.500,00 €'
      )
    ).toBeInTheDocument();
  });

  it('shows the total value in the item panel', () => {
    renderForm({ selectedItem: { id: 'item1', name: 'Test Item', onHand: 100 }, effectiveCurrentPrice: 50 });

    expect(detailsSpy).toHaveBeenCalledWith(expect.objectContaining({ showTotal: true }));
  });

  it('lists every matching supplier', async () => {
    const user = userEvent.setup();

    renderForm({
      suppliers: [
        { id: '1', label: 'Supplier A' },
        { id: '2', label: 'Supplier B' },
        { id: '3', label: 'Supplier C' },
      ],
    });

    await user.type(screen.getByRole('combobox', { name: 'inventory:table.supplier' }), 'Supplier');

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Supplier A', 'Supplier B', 'Supplier C']);
  });
});
