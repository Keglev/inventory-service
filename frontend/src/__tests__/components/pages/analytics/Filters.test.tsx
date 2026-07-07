/**
 * @file Filters.test.tsx
 * @module __tests__/components/pages/analytics/components/filters/Filters
 * @description
 * Enterprise tests for the Filters composition component:
 * - Renders the Filters header/title
 * - Composes DateRangeFilter + SupplierFilter
 * - Supports the disabled prop (passes through without crashing)
 *
 * We mock child filters because this suite verifies orchestration, not child behavior.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { SupplierRef } from '@/api/analytics/types';
import { Filters } from '@/pages/analytics/components/filters/Filters';

// B2 (CM-APP24): provide a react-i18next mock so useTranslation resolves without an
// i18n instance in this suite, silencing the NO_I18NEXT_INSTANCE warning. The stub
// mirrors react-i18next's no-instance fallback exactly — it returns an explicit string
// fallback / options.defaultValue when supplied, otherwise the key — so rendered text
// (and therefore every assertion) is unchanged.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, second?: unknown): string =>
      typeof second === 'string'
        ? second
        : second && typeof second === 'object' && 'defaultValue' in second
          ? String((second as { defaultValue?: unknown }).defaultValue ?? key)
          : key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/pages/analytics/components/filters/DateRangeFilter', () => ({
  DateRangeFilter: vi.fn(() => <div data-testid="date-range-filter">DateRangeFilter</div>),
}));

vi.mock('@/pages/analytics/components/filters/SupplierFilter', () => ({
  SupplierFilter: vi.fn(() => <div data-testid="supplier-filter">SupplierFilter</div>),
}));

describe('Filters', () => {
  const suppliers: SupplierRef[] = [
    { id: 'sup-1', name: 'Supplier A' },
    { id: 'sup-2', name: 'Supplier B' },
  ];

  const value = {
    from: '2025-01-01',
    to: '2025-12-31',
    supplierId: undefined,
    quick: '180' as const,
  };

  const onChange = vi.fn();

  it('renders the filters heading', () => {
    render(<Filters value={value} suppliers={suppliers} onChange={onChange} />);
    expect(screen.getByText(/filters/i)).toBeInTheDocument();
  });

  it('renders DateRangeFilter and SupplierFilter', () => {
    render(<Filters value={value} suppliers={suppliers} onChange={onChange} />);

    expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
    expect(screen.getByTestId('supplier-filter')).toBeInTheDocument();
  });

  it('supports the disabled prop', () => {
    render(<Filters value={value} suppliers={suppliers} onChange={onChange} disabled />);
    expect(screen.getByTestId('date-range-filter')).toBeInTheDocument();
    expect(screen.getByTestId('supplier-filter')).toBeInTheDocument();
  });
});
