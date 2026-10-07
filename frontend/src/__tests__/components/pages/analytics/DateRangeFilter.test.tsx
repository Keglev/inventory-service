/**
 * @file DateRangeFilter.test.tsx
 * @module __tests__/components/pages/analytics/components/filters/DateRangeFilter
 * @description
 * Tests for DateRangeFilter:
 * - Quick range buttons render and reflect active state
 * - Clicking quick ranges calls onChange with the expected `quick` value
 * - Custom mode shows date inputs and emits changes via onChange
 * - Disabled state prevents interaction
 * - Optional reset action triggers onReset
 * - An inverted custom range (from after to) is held in the fields, never
 *   sent; the alert and the error state show until a valid range, a quick
 *   range or a reset replaces it
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import userEvent from '@testing-library/user-event';

import type { AnalyticsFilters } from '@/pages/analytics/components/filters/Filters.types';
import { DateRangeFilter } from '@/pages/analytics/components/filters/DateRangeFilter';
import { tEn } from '../../../test/i18nEn';

// B2: provide a react-i18next mock so useTranslation resolves without an
// i18n instance in this suite, silencing the NO_I18NEXT_INSTANCE warning. The stub
// mirrors react-i18next's no-instance fallback exactly — it returns an explicit string
// fallback / options.defaultValue when supplied, otherwise the key — so rendered text
// (and therefore every assertion) is unchanged.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    i18n: { language: 'en' },
  }),
}));

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

// -----------------------------------------------------------------------------
// Inverted custom range
// -----------------------------------------------------------------------------

const customValue: AnalyticsFilters = { ...baseValue, quick: 'custom' };
const resetValue: AnalyticsFilters = { ...baseValue, quick: '180' };

/** Holds the filter state like the analytics page does, so valid changes re-render. */
function Harness({ onChange }: { onChange: (f: AnalyticsFilters) => void }) {
  const [value, setValue] = useState<AnalyticsFilters>(customValue);
  return (
    <DateRangeFilter
      value={value}
      onChange={(f) => {
        onChange(f);
        setValue(f);
      }}
      onReset={() => setValue(resetValue)}
    />
  );
}

const fromInput = () => screen.getByLabelText(/from/i) as HTMLInputElement;
const toInput = () => screen.getByLabelText(/^to$/i) as HTMLInputElement;
const invertRange = () => fireEvent.change(fromInput(), { target: { value: '2026-01-15' } });

describe('DateRangeFilter inverted range', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('holds an inverted range in the fields without calling onChange', () => {
    render(<Harness onChange={onChange} />);

    invertRange();

    expect(onChange).not.toHaveBeenCalled();
    expect(fromInput().value).toBe('2026-01-15');
    expect(toInput().value).toBe('2025-12-31');
    expect(fromInput()).toHaveAttribute('aria-invalid', 'true');
    expect(toInput()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('The From date cannot be after the To date.');
  });

  it('emits the full range when an inverted range is corrected', () => {
    render(<Harness onChange={onChange} />);

    invertRange();
    fireEvent.change(toInput(), { target: { value: '2026-02-01' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ ...customValue, from: '2026-01-15', to: '2026-02-01' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('emits a valid custom change with both dates', () => {
    render(<Harness onChange={onChange} />);

    fireEvent.change(fromInput(), { target: { value: '2025-06-01' } });

    expect(onChange).toHaveBeenCalledWith({ ...customValue, from: '2025-06-01', to: '2025-12-31' });
    expect(fromInput()).toHaveAttribute('aria-invalid', 'false');
  });

  it('limits each input by the other date', () => {
    render(<Harness onChange={onChange} />);

    expect(fromInput()).toHaveAttribute('max', '2025-12-31');
    expect(toInput()).toHaveAttribute('min', '2025-01-01');
  });

  it('drops the held range when a quick range is chosen', async () => {
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    invertRange();
    await user.click(screen.getByRole('button', { name: /30 days/i }));
    await user.click(screen.getByRole('button', { name: /custom/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fromInput()).toHaveAttribute('aria-invalid', 'false');
  });

  it('drops the held range on reset', async () => {
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    invertRange();
    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fromInput().value).toBe('2025-01-01');
  });
});
