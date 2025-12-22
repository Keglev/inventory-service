/**
 * @file Filters.test.tsx
 * @module __tests__/pages/analytics/Filters
 * 
 * @summary
 * Tests for Filters component.
 * Tests rendering of date range and supplier filters.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { SupplierRef } from '../../../../api/analytics/types';

vi.mock('../../../../pages/analytics/components/filters/DateRangeFilter', () => ({
  DateRangeFilter: vi.fn(() => <div data-testid="date-range-filter">DateRangeFilter</div>),
}));

vi.mock('../../../../pages/analytics/components/filters/SupplierFilter', () => ({
  SupplierFilter: vi.fn(() => <div data-testid="supplier-filter">SupplierFilter</div>),
}));

const { Filters } = await import('../../../../pages/analytics/components/filters/Filters');

describe('Filters', () => {
  const mockSuppliers: SupplierRef[] = [
    { id: 'sup-1', name: 'Supplier A' },
    { id: 'sup-2', name: 'Supplier B' },
  ];

  const mockValue = {
    from: '2025-01-01',
    to: '2025-12-31',
    supplierId: undefined,
    quick: '180' as const,
  };

  const mockOnChange = vi.fn();

  it('renders filters title', () => {
    render(
      <Filters
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByText(/filters/i)).toBeInTheDocument();
  });

  it('renders DateRangeFilter component', () => {
    render(
      <Filters
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
  });

  it('renders SupplierFilter component', () => {
    render(
      <Filters
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
      />
    );
    expect(screen.getByTestId('supplier-filter')).toBeInTheDocument();
  });

  it('renders with disabled prop', () => {
    const { container } = render(
      <Filters
        value={mockValue}
        suppliers={mockSuppliers}
        onChange={mockOnChange}
        disabled={true}
      />
    );
    expect(container).toBeInTheDocument();
  });
});
