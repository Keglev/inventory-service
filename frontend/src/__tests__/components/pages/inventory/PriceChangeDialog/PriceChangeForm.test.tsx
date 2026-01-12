/**
 * @file PriceChangeForm.test.tsx
 *
 * @what_is_under_test PriceChangeForm component
 * @responsibility Render multi-step form fields for price change
 * @scope Form rendering, field visibility, user interactions, error display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import type { UsePriceChangeFormReturn } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';
import { PriceChangeForm } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeForm';
import type { PriceChangeForm as PriceChangeFormValues } from '../../../../../api/inventory/validation';

// Initialize i18n for tests
if (!i18n.isInitialized) {
  i18n.init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['common', 'inventory', 'errors'],
    defaultNS: 'common',
    resources: {
      en: {
        common: {
          selectOption: 'Select an option',
        },
        inventory: {
          'table.supplier': 'Supplier',
          'steps.selectSupplier': 'Step 1: Select Supplier',
          'steps.selectItem': 'Step 2: Search and Select Item',
          'steps.changePrice': 'Step 3: Enter New Price',
          'search.searchSelectItem': 'Search and select item...',
          'search.selectSupplierFirst': 'Select supplier first',
          'search.typeToSearch': 'Type at least 2 characters to search',
          'search.noItemsFound': 'No items found',
          'price.newPrice': 'New Price',
          'price.priceChange': 'Change from {{from}} to {{to}}',
        },
        errors: {},
      },
    },
  });
}

// Mock the PriceChangeItemDetails component to simplify rendering
vi.mock(
  '../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeItemDetails',
  () => ({
    PriceChangeItemDetails: ({
      item,
      currentPrice,
    }: {
      item: { name: string } | null;
      currentPrice: number;
    }) => (
      <div data-testid="item-details">
        {item ? `Item: ${item.name}` : 'No item selected'}
        {currentPrice > 0 && ` Current Price: ${currentPrice}`}
      </div>
    ),
  }),
);

type StateOverrides = Partial<UsePriceChangeFormReturn>;

const PriceChangeFormTestWrapper = ({ overrides }: { overrides?: StateOverrides }) => {
  const methods = useForm<PriceChangeFormValues>({
    defaultValues: {
      itemId: '',
      newPrice: 0,
    },
  });

  const baseState: UsePriceChangeFormReturn = {
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

  const mergedState: UsePriceChangeFormReturn = {
    ...baseState,
    ...(overrides ?? {}),
    formState: overrides?.formState
      ? { ...baseState.formState, ...overrides.formState }
      : baseState.formState,
  };

  return <PriceChangeForm state={mergedState} />;
};

const renderPriceChangeForm = (overrides?: StateOverrides) =>
  render(
    <I18nextProvider i18n={i18n}>
      <PriceChangeFormTestWrapper overrides={overrides} />
    </I18nextProvider>,
  );

describe('PriceChangeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all three steps', () => {
    renderPriceChangeForm();

    expect(screen.getByText('Step 1: Select Supplier')).toBeInTheDocument();
    expect(screen.getByText('Step 2: Search and Select Item')).toBeInTheDocument();
    expect(screen.getByText('Step 3: Enter New Price')).toBeInTheDocument();
  });

  it('renders Supplier select dropdown', () => {
    renderPriceChangeForm();

    const supplierSelect = within(screen.getByTestId('supplier-form-control')).getByRole('combobox');
    expect(supplierSelect).toBeInTheDocument();
  });

  it('renders supplier options', async () => {
    renderPriceChangeForm();

    const supplierSelect = within(screen.getByTestId('supplier-form-control')).getByRole('combobox');
    fireEvent.mouseDown(supplierSelect);

    await waitFor(() => {
      expect(screen.getByText('Supplier 1')).toBeInTheDocument();
      expect(screen.getByText('Supplier 2')).toBeInTheDocument();
    });
  });

  it('disables supplier select when loading', () => {
    renderPriceChangeForm({ suppliersLoading: true });

    const supplierControl = screen.getByTestId('supplier-form-control');
    const [supplierLabel] = within(supplierControl).getAllByText('Supplier');
    expect(supplierLabel).toHaveClass('Mui-disabled');
  });

  it('renders Item Autocomplete field', () => {
    renderPriceChangeForm();

    const itemInput = screen.getByPlaceholderText('Select supplier first');
    expect(itemInput).toBeInTheDocument();
  });

  it('disables Item Autocomplete when no supplier selected', () => {
    renderPriceChangeForm({ selectedSupplier: null });

    const itemInput = screen.getByPlaceholderText('Select supplier first');
    expect(itemInput).toBeDisabled();
  });

  it('enables Item Autocomplete when supplier is selected', () => {
    renderPriceChangeForm({ selectedSupplier: { id: '1', label: 'Supplier 1' } });

    const itemInput = screen.getByLabelText('Search and select item...');
    expect(itemInput).not.toBeDisabled();
  });

  it('renders New Price field', () => {
    renderPriceChangeForm();

    const newPriceInput = screen.getByLabelText('New Price');
    expect(newPriceInput).toBeInTheDocument();
  });

  it('disables New Price field when no item selected', () => {
    renderPriceChangeForm({ selectedItem: null });

    const newPriceInput = screen.getByLabelText('New Price');
    expect(newPriceInput).toBeDisabled();
  });

  it('enables New Price field when item is selected', () => {
    renderPriceChangeForm({
      selectedItem: {
        id: 'item1',
        name: 'Test Item',
        onHand: 100,
      },
    });

    const newPriceInput = screen.getByLabelText('New Price');
    expect(newPriceInput).not.toBeDisabled();
  });

  it('displays form error when formError is set', () => {
    renderPriceChangeForm({
      formError: 'Price change failed due to validation error',
    });

    expect(screen.getByText('Price change failed due to validation error')).toBeInTheDocument();
  });

  it('calls setFormError when error alert is closed', async () => {
    const mockSetFormError = vi.fn();

    renderPriceChangeForm({
      formError: 'Test error',
      setFormError: mockSetFormError,
    });

    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);

    expect(mockSetFormError).toHaveBeenCalledWith(null);
  });

  it('renders PriceChangeItemDetails component', () => {
    renderPriceChangeForm({
      selectedItem: {
        id: 'item1',
        name: 'Test Item',
        onHand: 100,
      },
      effectiveCurrentPrice: 50,
      effectiveCurrentQty: 100,
    });

    expect(screen.getByTestId('item-details')).toBeInTheDocument();
    expect(screen.getByText(/Item: Test Item/)).toBeInTheDocument();
  });

  it('updates selected supplier on dropdown change', async () => {
    const mockSetSelectedSupplier = vi.fn();
    renderPriceChangeForm({ setSelectedSupplier: mockSetSelectedSupplier });

    const supplierSelect = within(screen.getByTestId('supplier-form-control')).getByRole('combobox');
    fireEvent.mouseDown(supplierSelect);

    await waitFor(() => {
      const supplier1Option = screen.getByText('Supplier 1');
      fireEvent.click(supplier1Option);
    });

    await waitFor(() => {
      expect(mockSetSelectedSupplier).toHaveBeenCalled();
    });
  });

  it('shows price change helper text when item selected', () => {
    renderPriceChangeForm({
      selectedItem: {
        id: 'item1',
        name: 'Test Item',
        onHand: 100,
      },
      effectiveCurrentPrice: 50,
    });

    const newPriceInput = screen.getByLabelText('New Price');
    fireEvent.change(newPriceInput, { target: { value: '75' } });

    expect(screen.getByText(/Change from 50\.00 to 75\.00/)).toBeInTheDocument();
  });

  it('handles multiple suppliers in dropdown', async () => {
    renderPriceChangeForm({
      suppliers: [
        { id: '1', label: 'Supplier A' },
        { id: '2', label: 'Supplier B' },
        { id: '3', label: 'Supplier C' },
      ],
    });

    const supplierSelect = within(screen.getByTestId('supplier-form-control')).getByRole('combobox');
    fireEvent.mouseDown(supplierSelect);

    await waitFor(() => {
      expect(screen.getByText('Supplier A')).toBeInTheDocument();
      expect(screen.getByText('Supplier B')).toBeInTheDocument();
      expect(screen.getByText('Supplier C')).toBeInTheDocument();
    });
  });
});
