/**
 * @file DeleteSupplierSearchInput.test.tsx
 *
 * @what_is_under_test DeleteSupplierSearchInput component
 * @responsibility Render search input with loading indicator and delegate change handler
 * @out_of_scope Debounce logic or API integration
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { DeleteSupplierSearchInput } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchInput';

describe('DeleteSupplierSearchInput', () => {
  it('renders search input with provided value and placeholder', () => {
    render(
      <DeleteSupplierSearchInput value="ac" onChange={vi.fn()} isLoading={false} />
    );

    const input = screen.getByPlaceholderText('Enter supplier name (min 2 chars)...');
    expect(input).toHaveValue('ac');
    expect(input).not.toBeDisabled();
  });

  it('invokes onChange with new value when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<DeleteSupplierSearchInput value="" onChange={onChange} isLoading={false} />);

    const input = screen.getByPlaceholderText('Enter supplier name (min 2 chars)...');
    await user.type(input, 'su');

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenNthCalledWith(1, 's');
    expect(onChange).toHaveBeenNthCalledWith(2, 'u');
  });

  it('disables input and shows progress indicator while loading', () => {
    render(<DeleteSupplierSearchInput value="test" onChange={vi.fn()} isLoading={true} />);

    const input = screen.getByPlaceholderText('Enter supplier name (min 2 chars)...');
    expect(input).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
