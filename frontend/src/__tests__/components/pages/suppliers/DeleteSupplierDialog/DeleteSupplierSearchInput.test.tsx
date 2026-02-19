/**
 * @file DeleteSupplierSearchInput.test.tsx
 * @module __tests__/components/pages/suppliers/DeleteSupplierDialog/DeleteSupplierSearchInput
 * @description Contract tests for the DeleteSupplierSearchInput presentation component.
 *
 * Contract under test:
 * - Renders an input with the expected placeholder and value.
 * - Delegates user input via `onChange(query)`.
 * - While loading, disables the input and shows a progress indicator.
 *
 * Out of scope:
 * - Debounce/search orchestration and API integration (handled by workflow hook tests).
 * - MUI styling internals.
 *
 * Test strategy:
 * - i18n is mocked to return fallback/defaultValue for deterministic strings.
 * - Tests assert accessibility contracts (placeholder/roles) rather than MUI structure.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import * as React from 'react';

vi.mock('react-i18next', () => ({
  // Prefer fallback/defaultValue to keep assertions stable across locales.
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { DeleteSupplierSearchInput } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchInput';

// -------------------------------------
// Test helpers
// -------------------------------------
const renderInput = (overrides?: Partial<ComponentProps<typeof DeleteSupplierSearchInput>>) => {
  const props: ComponentProps<typeof DeleteSupplierSearchInput> = {
    value: '',
    onChange: vi.fn(async () => undefined),
    isLoading: false,
    ...overrides,
  };

  render(<DeleteSupplierSearchInput {...props} />);
  return props;
};

describe('DeleteSupplierSearchInput', () => {
  it('renders search input with provided value and placeholder', () => {
    renderInput({ value: 'ac' });

    const input = screen.getByPlaceholderText('Enter supplier name (min 2 chars)...');
    expect(input).toHaveValue('ac');
    expect(input).not.toBeDisabled();
  });

  it('invokes onChange with new value when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn(async (next: string) => {
      void next;
    });

    // Harness the component as a controlled input: value must be updated between keystrokes
    // or subsequent `onChange` events will only reflect the last typed character.
    const ControlledHarness = () => {
      const [value, setValue] = React.useState('');

      return (
        <DeleteSupplierSearchInput
          value={value}
          isLoading={false}
          onChange={async (next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    };

    render(<ControlledHarness />);

    const input = screen.getByPlaceholderText('Enter supplier name (min 2 chars)...');
    await user.type(input, 'su');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, 's');
    // Controlled inputs emit the full value on each change event.
    expect(onChange).toHaveBeenNthCalledWith(2, 'su');
  });

  it('disables input and shows progress indicator while loading', () => {
    renderInput({ value: 'test', isLoading: true });

    const input = screen.getByPlaceholderText('Enter supplier name (min 2 chars)...');
    expect(input).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
