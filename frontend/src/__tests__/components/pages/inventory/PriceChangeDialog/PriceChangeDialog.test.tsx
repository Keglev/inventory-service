/**
 * @file PriceChangeDialog.test.tsx
 *
 * @what_is_under_test PriceChangeDialog component
 * @responsibility Render dialog wrapper and manage dialog lifecycle
 * @scope Dialog rendering, UI elements, user interactions
 */

import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { PriceChangeDialog } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeDialog';
import type { PriceChangeDialogProps } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeDialog.types';
import type { UsePriceChangeFormReturn } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';
import type { ItemOption } from '../../../../../api/analytics/types';
import { usePriceChangeForm } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';

vi.mock('../../../../../context/toast', () => ({
  useToast: () => vi.fn(),
}));

vi.mock('../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm', () => ({
  usePriceChangeForm: vi.fn(),
}));

vi.mock('../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeForm', () => ({
  PriceChangeForm: () => <div data-testid="price-change-form" />,
}));

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
          'actions.cancel': 'Cancel',
          help: 'Help',
          saving: 'Saving...',
        },
        inventory: {
          'toolbar.changePrice': 'Change Price',
          'buttons.applyPriceChange': 'Apply Price Change',
          'steps.selectSupplier': 'Step 1: Select Supplier',
          'steps.selectItem': 'Step 2: Search and Select Item',
          'steps.changePrice': 'Step 3: Enter New Price',
          'table.supplier': 'Supplier',
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

const createWrapper = () => ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const usePriceChangeFormMock = vi.mocked(usePriceChangeForm);

const createMockFormState = (): UsePriceChangeFormReturn => {
  const state = {
    selectedSupplier: null,
    selectedItem: null,
    itemQuery: '',
    formError: null,
    setSelectedSupplier: vi.fn(),
    setSelectedItem: vi.fn(),
    setItemQuery: vi.fn(),
    setFormError: vi.fn(),
    suppliers: [],
    items: [],
    suppliersLoading: false,
    itemsLoading: false,
    itemDetailsLoading: false,
    effectiveCurrentPrice: 0,
    effectiveCurrentQty: 0,
    register: vi.fn() as UsePriceChangeFormReturn['register'],
    control: {} as UsePriceChangeFormReturn['control'],
    formState: {
      errors: {},
      isSubmitting: false,
      isDirty: false,
      isLoading: false,
      isValid: true,
      isValidating: false,
      dirtyFields: {},
      touchedFields: {},
      submitCount: 0,
    } as UsePriceChangeFormReturn['formState'],
    setValue: vi.fn() as UsePriceChangeFormReturn['setValue'],
    setError: vi.fn() as UsePriceChangeFormReturn['setError'],
    clearErrors: vi.fn() as UsePriceChangeFormReturn['clearErrors'],
    handleSubmit: vi.fn() as UsePriceChangeFormReturn['handleSubmit'],
    onSubmit: vi.fn(async () => {}) as UsePriceChangeFormReturn['onSubmit'],
    handleClose: vi.fn(),
  } as unknown as UsePriceChangeFormReturn;

  return state;
};

const createMockItem = (overrides: Partial<ItemOption> = {}): ItemOption => ({
  id: '1',
  name: 'Sample Item',
  onHand: 10,
  price: 12,
  supplierId: 'supplier-1',
  ...overrides,
});

describe('PriceChangeDialog', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnPriceChanged: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnPriceChanged = vi.fn();
    usePriceChangeFormMock.mockReset();
    usePriceChangeFormMock.mockReturnValue(createMockFormState());
  });

  it('renders dialog when open prop is true', () => {
    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    expect(screen.getByText('Change Price')).toBeInTheDocument();
  });

  it('does not render dialog when open prop is false', () => {
    const props: PriceChangeDialogProps = {
      open: false,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    // Dialog should not be in the DOM when closed
    expect(screen.queryByText('Change Price')).not.toBeInTheDocument();
  });

  it('renders Cancel button', () => {
    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('renders Apply Price Change button', () => {
    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    expect(screen.getByRole('button', { name: /apply price change/i })).toBeInTheDocument();
  });

  it('renders Help button with tooltip', () => {
    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    const helpButton = screen.getByLabelText('help');
    expect(helpButton).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    const handleClose = vi.fn();
    const state = createMockFormState();
    state.handleClose = handleClose;
    usePriceChangeFormMock.mockReturnValue(state);

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('opens help link in new window when Help button is clicked', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    const helpButton = screen.getByLabelText('help');
    fireEvent.click(helpButton);

    expect(windowOpenSpy).toHaveBeenCalledWith('#/help?section=inventory.changePrice', '_blank');

    windowOpenSpy.mockRestore();
  });

  it('renders PriceChangeForm component', () => {
    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    expect(screen.getByTestId('price-change-form')).toBeInTheDocument();
  });

  it('disables Apply button when form is submitting', async () => {
    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    const state = createMockFormState();
    state.formState = { ...state.formState, isSubmitting: true };
    state.selectedItem = createMockItem();
    usePriceChangeFormMock.mockReturnValue(state);

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    const applyButton = screen.getByTestId('apply-price-change-button') as HTMLButtonElement;
    expect(applyButton.disabled).toBe(true);
  });

  it('disables Apply button when no item selected', () => {
    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    const state = createMockFormState();
    state.selectedItem = null;
    usePriceChangeFormMock.mockReturnValue(state);

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    const applyButton = screen.getByTestId('apply-price-change-button') as HTMLButtonElement;
    expect(applyButton.disabled).toBe(true);
  });

  it('enables Apply button when item selected and not submitting', () => {
    const props: PriceChangeDialogProps = {
      open: true,
      onClose: mockOnClose,
      onPriceChanged: mockOnPriceChanged,
      readOnly: false,
    };

    const state = createMockFormState();
    state.selectedItem = createMockItem();
    usePriceChangeFormMock.mockReturnValue(state);

    render(<PriceChangeDialog {...props} />, { wrapper: createWrapper() });

    const applyButton = screen.getByTestId('apply-price-change-button') as HTMLButtonElement;
    expect(applyButton.disabled).toBe(false);
  });
});
