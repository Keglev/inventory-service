/**
 * @file SupplierFilter.test.tsx
 * @module __tests__/pages/analytics/SupplierFilter
 * 
 * @summary
 * Tests for SupplierFilter component.
 * Tests supplier dropdown rendering and selection.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupplierRef } from '../../../../api/analytics/types';
import type { AnalyticsFilters } from '../../../../pages/analytics/components/filters/Filters.types';

const { SupplierFilter } = await import('../../../../pages/analytics/components/filters/SupplierFilter');

describe('SupplierFilter', () => {
  const mockOnChange = vi.fn();

  const mockSuppliers: SupplierRef[] = [
    { id: 'sup-1', name: 'Supplier A' },
    { id: 'sup-2', name: 'Supplier B' },
    { id: 'sup-3', name: 'Supplier C' },
  ];

  const mockValue: AnalyticsFilters = {
    from: '2025-01-01',
    to: '2025-12-31',
    supplierId: undefined,
    quick: '180',
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders supplier dropdown', () => {
    render(
      <SupplierFilter
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('renders all supplier options', () => {
    render(
      <SupplierFilter
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    const options = screen.getAllByRole('option');
    // +1 for "All Suppliers" option
    expect(options).toHaveLength(mockSuppliers.length + 1);
  });

  it('renders "All Suppliers" as default option', () => {
    render(
      <SupplierFilter
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    const allOption = screen.getByRole('option', { name: /all suppliers/i });
    expect(allOption).toBeInTheDocument();
  });

  it('displays selected supplier correctly', () => {
    const valueWithSupplier = { ...mockValue, supplierId: 'sup-2' };
    render(
      <SupplierFilter
        value={valueWithSupplier}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('sup-2');
  });

  it('calls onChange when supplier is selected', async () => {
    const user = userEvent.setup();
    render(
      <SupplierFilter
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'sup-1');
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierId: 'sup-1',
      })
    );
  });

  it('calls onChange with undefined when "All Suppliers" is selected', async () => {
    const user = userEvent.setup();
    const valueWithSupplier = { ...mockValue, supplierId: 'sup-1' };
    render(
      <SupplierFilter
        value={valueWithSupplier}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    await user.selectOptions(select, '');
    
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierId: undefined,
      })
    );
  });

  it('disables dropdown when disabled prop is true', () => {
    render(
      <SupplierFilter
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
        disabled={true}
      />
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('renders empty suppliers list gracefully', () => {
    render(
      <SupplierFilter
        value={mockValue}
        suppliers={[]}
        onChange={mockOnChange}
      />
    );
    const options = screen.getAllByRole('option');
    // Only "All Suppliers" option
    expect(options).toHaveLength(1);
  });

  it('displays supplier names correctly', () => {
    render(
      <SupplierFilter
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByRole('option', { name: 'Supplier A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supplier B' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Supplier C' })).toBeInTheDocument();
  });
});
