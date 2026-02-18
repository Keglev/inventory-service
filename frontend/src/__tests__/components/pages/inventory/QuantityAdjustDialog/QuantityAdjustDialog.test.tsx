/**
 * @file QuantityAdjustDialog.test.tsx
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/QuantityAdjustDialog
 * @description Contract tests for QuantityAdjustDialog:
 * - Wires dialog props into useQuantityAdjustForm.
 * - Passes orchestrator state into QuantityAdjustForm.
 * - Enables/disables primary action based on selection + submitting state.
 * - Opens the correct contextual help topic.
 *
 * Out of scope:
 * - QuantityAdjustForm internals (covered by QuantityAdjustForm.test.tsx).
 * - Hook internals (covered by useQuantityAdjustForm.test.ts).
 * - MUI rendering details.
 */

// Shared deterministic mocks (i18n + toast) for this folder.
import './testSetup';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseQuantityAdjustFormReturn } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm';
import { makeQuantityAdjustForm } from './fixtures';

// Spies for contract assertions (prop wiring + help topic routing).
const useQuantityAdjustFormMock = vi.fn();
const quantityFormPropsSpy = vi.fn();
const helpButtonPropsSpy = vi.fn();
const openHelpMock = vi.fn();

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm', () => ({
  useQuantityAdjustForm: (...args: unknown[]) => useQuantityAdjustFormMock(...args),
}));

vi.mock('../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustForm', () => ({
  QuantityAdjustForm: (props: { form: UseQuantityAdjustFormReturn }) => {
    // Keep this test focused on the dialog contract (not form internals).
    quantityFormPropsSpy(props);
    return <div data-testid="quantity-adjust-form">QuantityAdjustForm</div>;
  },
}));

vi.mock('../../../../../features/help', () => ({
  HelpIconButton: (props: { topicId: string; tooltip?: string }) => {
    // Replace implementation with a stable button we can click.
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

import { QuantityAdjustDialog } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustDialog';

beforeEach(() => {
  vi.clearAllMocks();
  openHelpMock.mockClear();
});

describe('QuantityAdjustDialog', () => {
  it('initializes orchestrator hook and renders heading with help button', () => {
    const formState = makeQuantityAdjustForm();
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
    const formState = makeQuantityAdjustForm();
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(<QuantityAdjustDialog open={true} onClose={vi.fn()} onAdjusted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(formState.handleClose).toHaveBeenCalledTimes(1);
  });

  it('disables apply button when no item selected', () => {
    const formState = makeQuantityAdjustForm({ selectedItem: null });
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(<QuantityAdjustDialog open={true} onClose={vi.fn()} onAdjusted={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Apply Adjustment' })).toBeDisabled();
  });

  it('invokes onSubmit when apply button clicked with selected item', async () => {
    const user = userEvent.setup();
    const formState = makeQuantityAdjustForm({
      selectedItem: { id: 'item-1', name: 'Item 1', onHand: 5 },
    });
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(<QuantityAdjustDialog open={true} onClose={vi.fn()} onAdjusted={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Apply Adjustment' }));
    expect(formState.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows submitting state with loader and disabled actions', () => {
    const formState = makeQuantityAdjustForm({
      selectedItem: { id: 'item-1', name: 'Item 1', onHand: 5 },
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
    const formState = makeQuantityAdjustForm();
    useQuantityAdjustFormMock.mockReturnValue(formState);

    render(<QuantityAdjustDialog open={true} onClose={vi.fn()} onAdjusted={vi.fn()} />);

    await user.click(screen.getByLabelText('Help'));
    expect(openHelpMock).toHaveBeenCalledWith('inventory.adjustQuantity');
  });
});
