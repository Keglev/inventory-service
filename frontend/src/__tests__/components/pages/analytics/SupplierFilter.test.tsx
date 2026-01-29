/**
 * @file SupplierFilter.test.tsx
 * @module __tests__/components/pages/analytics/components/filters/SupplierFilter
 * @description
 * Enterprise tests for SupplierFilter:
 * - Renders supplier dropdown and options (including "All suppliers")
 * - Reflects current selection via `value.supplierId`
 * - Emits `onChange` with updated supplierId (or undefined for "All suppliers")
 * - Honors disabled state
 * - Handles empty supplier lists safely
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SupplierRef } from '@/api/analytics/types';
import type { AnalyticsFilters } from '@/pages/analytics/components/filters/Filters.types';
import { SupplierFilter } from '@/pages/analytics/components/filters/SupplierFilter';

// -----------------------------------------------------------------------------
// Test data
// -----------------------------------------------------------------------------

const suppliers: SupplierRef[] = [
  { id: 'sup-1', name: 'Supplier A' },
  { id: 'sup-2', name: 'Supplier B' },
  { id: 'sup-3', name: 'Supplier C' },
];

const baseValue: AnalyticsFilters = {
  from: '2025-01-01',
  to: '2025-12-31',
  supplierId: undefined,
  quick: '180',
};

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('SupplierFilter', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a supplier dropdown', () => {
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders "All suppliers" plus all supplier options', () => {
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} />);

    // Native select exposes options directly.
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(suppliers.length + 1);

    expect(screen.getByRole('option', { name: /all suppliers/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supplier A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supplier B' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supplier C' })).toBeInTheDocument();
  });

  it('reflects the selected supplier from props', () => {
    render(
      <SupplierFilter
        value={{ ...baseValue, supplierId: 'sup-2' }}
        suppliers={suppliers}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('combobox')).toHaveValue('sup-2');
  });

  it('emits onChange with the selected supplierId', async () => {
    const user = userEvent.setup();
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} />);

    await user.selectOptions(screen.getByRole('combobox'), 'sup-1');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ supplierId: 'sup-1' }));
  });

  it('emits onChange with supplierId=undefined when "All suppliers" is selected', async () => {
    const user = userEvent.setup();
    render(
      <SupplierFilter
        value={{ ...baseValue, supplierId: 'sup-1' }}
        suppliers={suppliers}
        onChange={onChange}
      />,
    );

    // Conventional "all" option uses empty string.
    await user.selectOptions(screen.getByRole('combobox'), '');
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ supplierId: undefined }));
  });

  it('disables the dropdown when disabled', () => {
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('handles an empty suppliers list', () => {
    render(<SupplierFilter value={baseValue} suppliers={[]} onChange={onChange} />);
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: /all suppliers/i })).toBeInTheDocument();
  });
});
