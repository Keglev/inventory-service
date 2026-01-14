/**
 * @file QuantityAdjustDialog.test.tsx
 *
 * @what_is_under_test QuantityAdjustDialog component
 * @responsibility Render dialog wrapper and manage dialog lifecycle
 * @out_of_scope QuantityAdjustForm internals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseQuantityAdjustFormReturn } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm';

const useQuantityAdjustFormMock = vi.fn();
const quantityFormPropsSpy = vi.fn();
const helpButtonPropsSpy = vi.fn();
const openHelpMock = vi.fn();

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm', () => ({
  useQuantityAdjustForm: (...args: unknown[]) => useQuantityAdjustFormMock(...args),
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustForm', () => ({
  QuantityAdjustForm: (props: { form: UseQuantityAdjustFormReturn }) => {
    quantityFormPropsSpy(props);
    return <div data-testid="quantity-adjust-form">QuantityAdjustForm</div>;
  },
}));

vi.mock('../../../../../features/help', () => ({
  HelpIconButton: (props: { topicId: string; tooltip?: string }) => {
    helpButtonPropsSpy(props);
    return (
      <button
        type="button"
        aria-label={props.tooltip ?? 'Help'}
        onClick={() => openHelpMock(props.topicId)}
      >
        Help
      </button>
    );
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { QuantityAdjustDialog } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustDialog';

const createFormState = (
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
  openHelpMock.mockClear();
});

describe('QuantityAdjustDialog', () => {
  it('initializes orchestrator hook and renders heading with help button', () => {
    const formState = createFormState();
    const onClose = vi.fn();
    const onAdjusted = vi.fn();
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(
      <QuantityAdjustDialog open={true} onClose={onClose} onAdjusted={onAdjusted} readOnly={false} />
    );

    expect(useQuantityAdjustFormMock).toHaveBeenCalledWith(true, onClose, onAdjusted, false);
    expect(screen.getByRole('heading', { name: /Adjust Quantity/ })).toBeInTheDocument();
    expect(quantityFormPropsSpy).toHaveBeenCalledWith({ form: formState });
    expect(helpButtonPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ topicId: 'inventory.adjustQuantity', tooltip: 'Help' })
    );
  });

  it('delegates cancel action to handleClose', async () => {
    const user = userEvent.setup();
    const formState = createFormState();
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(<QuantityAdjustDialog open={true} onClose={vi.fn()} onAdjusted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(formState.handleClose).toHaveBeenCalledTimes(1);
  });

  it('disables apply button when no item selected', () => {
    const formState = createFormState({ selectedItem: null });
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(<QuantityAdjustDialog open={true} onClose={vi.fn()} onAdjusted={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Apply Adjustment' })).toBeDisabled();
  });

  it('invokes onSubmit when apply button clicked with selected item', async () => {
    const user = userEvent.setup();
    const formState = createFormState({
      selectedItem: { id: 'item-1', name: 'Item 1', onHand: 5 } as UseQuantityAdjustFormReturn['selectedItem'],
    });
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(<QuantityAdjustDialog open={true} onClose={vi.fn()} onAdjusted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Apply Adjustment' }));
    expect(formState.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows submitting state with loader and disabled actions', () => {
    const formState = createFormState({
      selectedItem: { id: 'item-1', name: 'Item 1', onHand: 5 } as UseQuantityAdjustFormReturn['selectedItem'],
      formState: { errors: {}, isSubmitting: true } as UseQuantityAdjustFormReturn['formState'],
    });
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(<QuantityAdjustDialog open={true} onClose={vi.fn()} onAdjusted={vi.fn()} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    const savingButton = screen.getByRole('button', { name: /Saving/ });
    expect(savingButton).toBeDisabled();
    expect(savingButton).toHaveTextContent('Saving...');
  });

  it('opens contextual help topic when help button clicked', async () => {
    const user = userEvent.setup();
    const formState = createFormState();
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(<QuantityAdjustDialog open={true} onClose={vi.fn()} onAdjusted={vi.fn()} />);

    await user.click(screen.getByLabelText('Help'));
    expect(openHelpMock).toHaveBeenCalledWith('inventory.adjustQuantity');
  });
});
