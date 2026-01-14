/**
 * @file QuantityAdjustQuantityInput.test.tsx
 *
 * @what_is_under_test QuantityAdjustQuantityInput component
 * @responsibility Render quantity change and reason fields with validation messaging
 * @out_of_scope Form schema logic, submission side effects
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, type FieldErrors } from 'react-hook-form';
import { QuantityAdjustQuantityInput } from '../../../../../pages/inventory/dialogs/QuantityAdjustDialog/QuantityAdjustQuantityInput';
import type { QuantityAdjustForm } from '../../../../../api/inventory/validation';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallbackOrOptions?: unknown, maybeOptions?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrOptions === 'string' ? fallbackOrOptions : undefined;
      const options = (typeof fallbackOrOptions === 'object' && fallbackOrOptions !== null
        ? (fallbackOrOptions as Record<string, unknown>)
        : maybeOptions) ?? {};

      const template = fallback ?? key;
      return Object.entries(options).reduce((acc, [optionKey, value]) =>
        acc.replace(new RegExp(`{{${optionKey}}}`, 'g'), String(value)), template);
    },
  }),
}));

type HarnessProps = {
  disabled?: boolean;
  errors?: FieldErrors<QuantityAdjustForm>;
  currentQty?: number;
};

const TestHarness = ({ disabled = false, errors = {}, currentQty = 20 }: HarnessProps) => {
  const form = useForm<QuantityAdjustForm>({
    defaultValues: {
      newQuantity: 5,
      reason: 'INITIAL_STOCK',
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
});
