/**
 * @file DateRangeFilter.test.tsx
 * @module __tests__/pages/analytics/DateRangeFilter
 * 
 * @summary
 * Tests for DateRangeFilter component.
 * Tests quick range buttons, custom date inputs, and state management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnalyticsFilters } from '../../../../pages/analytics/components/filters/Filters.types';

const { DateRangeFilter } = await import('../../../../pages/analytics/components/filters/DateRangeFilter');

describe('DateRangeFilter', () => {
  const mockOnChange = vi.fn();
  const mockOnReset = vi.fn();

  const mockValue: AnalyticsFilters = {
    from: '2025-01-01',
    to: '2025-12-31',
    supplierId: undefined,
    quick: '180',
  };

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnReset.mockClear();
  });

  it('renders quick range buttons', () => {
    render(
      <DateRangeFilter value={mockValue} onChange={mockOnChange} />
    );
    expect(screen.getByRole('button', { name: /30 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /90 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /180 days/i })).toBeInTheDocument();
  });

  it('highlights active quick range button', () => {
    const value = { ...mockValue, quick: '30' as const };
    render(<DateRangeFilter value={value} onChange={mockOnChange} />);
    
    const button30 = screen.getByRole('button', { name: /30 days/i });
    expect(button30).toHaveClass('MuiButton-contained');
  });

  it('calls onChange when 30 days button is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter value={mockValue} onChange={mockOnChange} />);
    
    const button30 = screen.getByRole('button', { name: /30 days/i });
    await user.click(button30);
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        quick: '30',
      })
    );
  });

  it('calls onChange when 90 days button is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter value={mockValue} onChange={mockOnChange} />);
    
    const button90 = screen.getByRole('button', { name: /90 days/i });
    await user.click(button90);
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        quick: '90',
      })
    );
  });

  it('calls onChange when 180 days button is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter value={mockValue} onChange={mockOnChange} />);
    
    const button180 = screen.getByRole('button', { name: /180 days/i });
    await user.click(button180);
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        quick: '180',
      })
    );
  });

  it('shows custom date inputs when custom is selected', async () => {
    const customValue = { ...mockValue, quick: 'custom' as const };
    render(<DateRangeFilter value={customValue} onChange={mockOnChange} />);
    
    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
  });

  it('calls onChange when from date is changed', async () => {
    const user = userEvent.setup();
    const customValue = { ...mockValue, quick: 'custom' as const, from: '' };
    render(<DateRangeFilter value={customValue} onChange={mockOnChange} />);
    
    const fromInput = screen.getByLabelText(/from/i);
    await user.type(fromInput, '2025-06-01');
    
    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        quick: 'custom',
      })
    );
  });

  it('calls onChange when to date is changed', async () => {
    const user = userEvent.setup();
    const customValue = { ...mockValue, quick: 'custom' as const, to: '' };
    render(<DateRangeFilter value={customValue} onChange={mockOnChange} />);
    
    const toInput = screen.getByLabelText(/to/i);
    await user.type(toInput, '2025-12-31');
    
    expect(mockOnChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        quick: 'custom',
      })
    );
  });

  it('disables buttons when disabled prop is true', () => {
    render(<DateRangeFilter value={mockValue} onChange={mockOnChange} disabled={true} />);
    
    const button30 = screen.getByRole('button', { name: /30 days/i });
    expect(button30).toBeDisabled();
  });

  it('calls onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter value={mockValue} onChange={mockOnChange} onReset={mockOnReset} />);
    
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);
    
    expect(mockOnReset).toHaveBeenCalled();
  });
});
