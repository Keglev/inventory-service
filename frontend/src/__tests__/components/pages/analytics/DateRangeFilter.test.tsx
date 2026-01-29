/**
 * @file DateRangeFilter.test.tsx
 * @module __tests__/components/pages/analytics/components/filters/DateRangeFilter
 * @description
 * Enterprise tests for DateRangeFilter:
 * - Quick range buttons render and reflect active state
 * - Clicking quick ranges calls onChange with the expected `quick` value
 * - Custom mode shows date inputs and emits changes via onChange
 * - Disabled state prevents interaction
 * - Optional reset action triggers onReset
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { AnalyticsFilters } from '@/pages/analytics/components/filters/Filters.types';
import { DateRangeFilter } from '@/pages/analytics/components/filters/DateRangeFilter';

// -----------------------------------------------------------------------------
// Test data
// -----------------------------------------------------------------------------

const baseValue: AnalyticsFilters = {
  from: '2025-01-01',
  to: '2025-12-31',
  supplierId: undefined,
  quick: '180',
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('DateRangeFilter', () => {
  const onChange = vi.fn();
  const onReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quick range buttons', () => {
    render(<DateRangeFilter value={baseValue} onChange={onChange} />);

    expect(screen.getByRole('button', { name: /30 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /90 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /180 days/i })).toBeInTheDocument();
  });

  it('indicates the active quick range', () => {
    render(<DateRangeFilter value={{ ...baseValue, quick: '30' }} onChange={onChange} />);

    // MUI uses contained variant for the active selection.
    expect(screen.getByRole('button', { name: /30 days/i })).toHaveClass('MuiButton-contained');
  });

  it('calls onChange when a quick range is selected', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter value={baseValue} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /90 days/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ quick: '90' }));

    await user.click(screen.getByRole('button', { name: /30 days/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ quick: '30' }));

    await user.click(screen.getByRole('button', { name: /180 days/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ quick: '180' }));
  });

  it('renders custom date inputs when quick="custom"', () => {
    render(<DateRangeFilter value={{ ...baseValue, quick: 'custom' }} onChange={onChange} />);

    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
  });

  it('emits onChange when custom dates are edited', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter value={{ ...baseValue, quick: 'custom', from: '', to: '' }} onChange={onChange} />);

    await user.type(screen.getByLabelText(/from/i), '2025-06-01');
    await user.type(screen.getByLabelText(/to/i), '2025-12-31');

    // We only assert that custom mode is preserved and a change is emitted.
    // Exact value composition depends on the component's input handler.
    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ quick: 'custom' }));
  });

  it('disables quick range buttons when disabled', () => {
    render(<DateRangeFilter value={baseValue} onChange={onChange} disabled />);

    expect(screen.getByRole('button', { name: /30 days/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /90 days/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /180 days/i })).toBeDisabled();
  });

  it('calls onReset when reset button is clicked', async () => {
    const user = userEvent.setup();
    render(<DateRangeFilter value={baseValue} onChange={onChange} onReset={onReset} />);

    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
