/**
 * @file PriceChangeDialog.test.tsx
 * @module __tests__/pages/inventory/dialogs/PriceChangeDialog
 * @description
 * Contract tests for the PriceChangeDialog wrapper component:
 * - renders conditionally based on `open`
 * - exposes the dialog actions (Cancel / Apply / Help)
 * - delegates lifecycle actions to the orchestration hook (usePriceChangeForm)
 * - renders the form container component
 *
 * Notes:
 * - We mock translations to avoid coupling tests to i18n runtime setup.
 * - We test behavior/contract, not MUI internals.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PriceChangeDialog } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeDialog';
import type { PriceChangeDialogProps } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeDialog.types';
import type { UsePriceChangeFormReturn } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';
import type { ItemOption } from '../../../../../api/analytics/types';
import { usePriceChangeForm } from '../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm';

/**
 * Translation is treated as infrastructure.
 * We keep tests deterministic by returning keys directly.
 */
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

/**
 * Toast is an integration concern; not part of this wrapper contract.
 */
vi.mock('../../../../../context/toast', () => ({
  useToast: () => vi.fn(),
}));

/**
 * The dialog delegates orchestration to this hook; we control its return value.
 */
vi.mock('../../../../../pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm', () => ({
  usePriceChangeForm: vi.fn(),
}));

/**
 * Form rendering is tested separately; here we only assert it is mounted.
 */
vi.mock('../../../../../pages/inventory/dialogs/PriceChangeDialog/PriceChangeForm', () => ({
  PriceChangeForm: () => <div data-testid="price-change-form" />,
}));

const usePriceChangeFormMock = vi.mocked(usePriceChangeForm);

type FormStateOverrides = Partial<
  Pick<UsePriceChangeFormReturn, 'selectedItem' | 'handleClose' | 'formState'>
>;

/**
 * Creates an ItemOption test double.
 * Only fields used by the dialog contract are populated.
 */
const makeItem = (overrides: Partial<ItemOption> = {}): ItemOption => ({
  id: '1',
  name: 'Sample Item',
  onHand: 10,
  price: 12,
  supplierId: 'supplier-1',
  ...overrides,
});

/**
 * Minimal hook return value sufficient for the dialog wrapper tests.
 * We avoid "any" by typing only the parts used in these tests.
 */
const makeFormState = (overrides: FormStateOverrides = {}): UsePriceChangeFormReturn => {
  const base = {
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

    // react-hook-form API surface used by the dialog/form components.
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
  } satisfies Partial<UsePriceChangeFormReturn>;

  // The full hook type is larger; for wrapper tests we only need a stable object.
  return { ...(base as unknown as UsePriceChangeFormReturn), ...overrides };
};

const defaultProps = (): PriceChangeDialogProps => ({
  open: true,
  onClose: vi.fn(),
  onPriceChanged: vi.fn(),
  readOnly: false,
});

describe('PriceChangeDialog', () => {
  beforeEach(() => {
    usePriceChangeFormMock.mockReset();
    usePriceChangeFormMock.mockReturnValue(makeFormState());
  });

  it('renders when open=true', () => {
    render(<PriceChangeDialog {...defaultProps()} />);

    // We assert against translation keys (stable) rather than translated strings.
    expect(screen.getByText('inventory:toolbar.changePrice')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    render(<PriceChangeDialog {...defaultProps()} open={false} />);

    expect(screen.queryByText('inventory:toolbar.changePrice')).not.toBeInTheDocument();
  });

  it('renders Cancel and Apply actions', () => {
    render(<PriceChangeDialog {...defaultProps()} />);

    expect(screen.getByRole('button', { name: 'common:actions.cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'inventory:buttons.applyPriceChange' }),
    ).toBeInTheDocument();
  });

  it('renders Help action', () => {
    render(<PriceChangeDialog {...defaultProps()} />);

    // Contract: icon button labeled for accessibility.
    expect(screen.getByLabelText('help')).toBeInTheDocument();
  });

  it('delegates close to the orchestration hook when Cancel is clicked', async () => {
    const user = userEvent.setup();

    const handleClose = vi.fn();
    usePriceChangeFormMock.mockReturnValue(makeFormState({ handleClose }));

    render(<PriceChangeDialog {...defaultProps()} />);

    await user.click(screen.getByRole('button', { name: 'common:actions.cancel' }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('opens help link in a new window when Help is clicked', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<PriceChangeDialog {...defaultProps()} />);

    await user.click(screen.getByLabelText('help'));

    expect(openSpy).toHaveBeenCalledWith('#/help?section=inventory.changePrice', '_blank');

    openSpy.mockRestore();
  });

  it('renders the PriceChangeForm container', () => {
    render(<PriceChangeDialog {...defaultProps()} />);

    expect(screen.getByTestId('price-change-form')).toBeInTheDocument();
  });

  it('disables Apply when the form is submitting', () => {
    usePriceChangeFormMock.mockReturnValue(
      makeFormState({
        selectedItem: makeItem(),
        formState: {
          ...makeFormState().formState,
          isSubmitting: true,
        },
      }),
    );

    render(<PriceChangeDialog {...defaultProps()} />);

    expect(screen.getByTestId('apply-price-change-button')).toBeDisabled();
  });

  it('disables Apply when no item is selected', () => {
    usePriceChangeFormMock.mockReturnValue(makeFormState({ selectedItem: null }));

    render(<PriceChangeDialog {...defaultProps()} />);

    expect(screen.getByTestId('apply-price-change-button')).toBeDisabled();
  });

  it('enables Apply when an item is selected and not submitting', () => {
    usePriceChangeFormMock.mockReturnValue(makeFormState({ selectedItem: makeItem() }));

    render(<PriceChangeDialog {...defaultProps()} />);

    expect(screen.getByTestId('apply-price-change-button')).toBeEnabled();
  });
});
