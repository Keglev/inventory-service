import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuppliersFilterPanel } from '../../../../pages/suppliers/components/SuppliersFilterPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SuppliersFilterPanel', () => {
  const defaultProps = {
    showAllSuppliers: false,
    onToggleChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checkbox for show all suppliers', () => {
    render(<SuppliersFilterPanel {...defaultProps} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('checkbox is unchecked when showAllSuppliers is false', () => {
    render(<SuppliersFilterPanel {...defaultProps} showAllSuppliers={false} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('checkbox is checked when showAllSuppliers is true', () => {
    render(<SuppliersFilterPanel {...defaultProps} showAllSuppliers={true} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onToggleChange with true when checkbox is checked', async () => {
    const user = userEvent.setup();
    render(<SuppliersFilterPanel {...defaultProps} showAllSuppliers={false} />);
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(defaultProps.onToggleChange).toHaveBeenCalledWith(true);
  });

  it('calls onToggleChange with false when checkbox is unchecked', async () => {
    const user = userEvent.setup();
    render(<SuppliersFilterPanel {...defaultProps} showAllSuppliers={true} />);
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(defaultProps.onToggleChange).toHaveBeenCalledWith(false);
  });
});
