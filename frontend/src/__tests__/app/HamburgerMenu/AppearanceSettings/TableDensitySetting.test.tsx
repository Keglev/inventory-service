/**
 * @file TableDensitySetting.test.tsx
 * @module __tests__/app/HamburgerMenu/AppearanceSettings/TableDensitySetting
 * @description Tests for table density setting component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableDensitySetting from '../../../../app/HamburgerMenu/AppearanceSettings/TableDensitySetting';

// Hoisted mocks
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('TableDensitySetting', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders density setting component', () => {
    render(<TableDensitySetting tableDensity="comfortable" onChange={mockOnChange} />);
    expect(screen.getByText('Density')).toBeInTheDocument();
  });

  it('renders standard button', () => {
    render(<TableDensitySetting tableDensity="comfortable" onChange={mockOnChange} />);
    expect(screen.getByRole('button', { name: /standard/i })).toBeInTheDocument();
  });

  it('renders compact button', () => {
    render(<TableDensitySetting tableDensity="compact" onChange={mockOnChange} />);
    expect(screen.getByRole('button', { name: /kompakt/i })).toBeInTheDocument();
  });

  it('calls onChange with "comfortable" when standard clicked', async () => {
    const user = userEvent.setup();
    render(<TableDensitySetting tableDensity="compact" onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /standard/i }));

    expect(mockOnChange).toHaveBeenCalledWith('comfortable');
  });

  it('calls onChange with "compact" when compact clicked', async () => {
    const user = userEvent.setup();
    render(<TableDensitySetting tableDensity="comfortable" onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /kompakt/i }));

    expect(mockOnChange).toHaveBeenCalledWith('compact');
  });

  it('displays comfortable as selected when in comfortable mode', () => {
    render(<TableDensitySetting tableDensity="comfortable" onChange={mockOnChange} />);
    const button = screen.getByRole('button', { name: /standard/i });
    expect(button).toHaveClass('Mui-selected');
  });

  it('displays compact as selected when in compact mode', () => {
    render(<TableDensitySetting tableDensity="compact" onChange={mockOnChange} />);
    const button = screen.getByRole('button', { name: /kompakt/i });
    expect(button).toHaveClass('Mui-selected');
  });

  it('defaults to comfortable for invalid density values', () => {
    render(<TableDensitySetting tableDensity="invalid" onChange={mockOnChange} />);
    const button = screen.getByRole('button', { name: /standard/i });
    expect(button).toHaveClass('Mui-selected');
  });

  it('uses translations for labels', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'appearance.density') return 'Dichte';
      if (key === 'appearance.standard') return 'Normal';
      if (key === 'appearance.compact') return 'Kompakt';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<TableDensitySetting tableDensity="comfortable" onChange={mockOnChange} />);
    
    expect(screen.getByText('Dichte')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('does not call onChange when clicking currently selected option', async () => {
    const user = userEvent.setup();
    render(<TableDensitySetting tableDensity="comfortable" onChange={mockOnChange} />);

    // Click the already selected button
    await user.click(screen.getByRole('button', { name: /standard/i }));

    // onChange should not be called for already selected value
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('allows switching between modes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <TableDensitySetting tableDensity="comfortable" onChange={mockOnChange} />
    );

    await user.click(screen.getByRole('button', { name: /kompakt/i }));
    expect(mockOnChange).toHaveBeenCalledWith('compact');

    rerender(<TableDensitySetting tableDensity="compact" onChange={mockOnChange} />);

    await user.click(screen.getByRole('button', { name: /standard/i }));
    expect(mockOnChange).toHaveBeenCalledWith('comfortable');
  });
});
