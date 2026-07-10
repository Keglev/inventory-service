/**
 * @file QuantityAdjustQuantityInput.test.tsx
 * @module __tests__/components/pages/inventory/QuantityAdjustDialog/QuantityAdjustQuantityInput
 * @description Contract tests for QuantityAdjustQuantityInput:
 * - Renders quantity + reason fields.
 * - Shows a user-facing hint describing the change.
 * - Surfaces validation messages from formState.
 * - Disables controls when form is locked.
 *
 * Out of scope:
 * - Zod schema rules (only display behavior is tested here).
 * - Submission side effects.
 */

// Shared deterministic mocks (i18n + toast) for this folder.
import './testSetup';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { QuantityAdjustQuantityInput } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustQuantityInput';
import type { QuantityAdjustForm } from '../../../../../pages/inventory/validation/inventoryValidation';

type HarnessProps = {
  disabled?: boolean;
  errors?: FieldErrors<QuantityAdjustForm>;
  currentQty?: number;
  newQuantity?: number;
};

/**
 * Test harness so useForm() is invoked legally (Rules of Hooks).
 * The component under test only requires control + errors + flags.
 */
const TestHarness = ({ disabled = false, errors = {}, currentQty = 20, newQuantity = 5 }: HarnessProps) => {
  const form = useForm<QuantityAdjustForm>({
    defaultValues: {
      newQuantity,
      currentQuantity: currentQty,
      reason: 'MANUAL_UPDATE',
      itemId: '',
    },
  });

  return (
    <QuantityAdjustQuantityInput
      control={form.control}
      errors={errors}
      disabled={disabled}
      currentQty={currentQty}
    />
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('QuantityAdjustQuantityInput', () => {
  it('renders quantity and reason inputs with helper hint', () => {
    render(<TestHarness currentQty={15} />);

    expect(screen.getByText('Step 3: Adjust Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('New Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
    expect(screen.getByText('Changing from 15 to 5')).toBeInTheDocument();
  });

  it('updates quantity value and helper text as user types', () => {
    render(<TestHarness currentQty={10} />);

    const input = screen.getByLabelText('New Quantity') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '8' } });

    expect(input.value).toBe('8');
    expect(screen.getByText('Changing from 10 to 8')).toBeInTheDocument();
  });

  it('displays validation message for reason field', () => {
    render(
      <TestHarness
        errors={{ reason: { message: 'Reason required' } } as FieldErrors<QuantityAdjustForm>}
      />
    );

    expect(screen.getByText('Reason required')).toBeInTheDocument();
  });

  it('disables inputs when form is locked', () => {
    render(<TestHarness disabled={true} />);

    expect(screen.getByLabelText('New Quantity')).toBeDisabled();
    expect(screen.getByRole('combobox', { name: 'Reason' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('offers increase reasons when the new quantity is higher', () => {
    render(<TestHarness currentQty={5} newQuantity={10} />);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Reason' }));

    expect(screen.getByRole('option', { name: 'Initial Stock' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Returned by Customer' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sold' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Destroyed' })).not.toBeInTheDocument();
  });

  it('offers reduce reasons when the new quantity is lower', () => {
    render(<TestHarness currentQty={20} newQuantity={5} />);
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Reason' }));

    expect(screen.getByRole('option', { name: 'Sold' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Destroyed' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Returned to Supplier' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Initial Stock' })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Returned by Customer' })).not.toBeInTheDocument();
  });
});
