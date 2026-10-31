/**
 * @file SupplierFilter.test.tsx
 * @module __tests__/pages/analytics/components/filters/SupplierFilter
 * @description
 * Contract tests for SupplierFilter (the shared supplier search, S2-9):
 * - The external label names the field; an empty field reads "All suppliers"
 * - Two typed letters list the matching suppliers; a pick emits its supplierId
 * - Clearing the field emits supplierId=undefined ("All suppliers")
 * - Reflects the current selection via `value.supplierId`
 * - Stays enabled while suppliers load; handles an empty supplier list
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SupplierRef } from '@/api/analytics/types';
import type { AnalyticsFilters } from '@/pages/analytics/components/filters/Filters.types';
import { SupplierFilter } from '@/pages/analytics/components/filters/SupplierFilter';
import { tEn } from '@/__tests__/test/i18nEn';

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
// Helpers
// -----------------------------------------------------------------------------

describe('SupplierFilter', () => {
  const onChange = vi.fn();
  const field = () => screen.getByRole('combobox', { name: 'Supplier' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a supplier search field named by its label, reading "All suppliers" when empty', () => {
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} />);

    expect(field()).toHaveValue('');
    expect(field()).toHaveAttribute('placeholder', 'All Suppliers');
  });

  it('lists the matching suppliers after two letters', async () => {
    const user = userEvent.setup();
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} />);

    await user.type(field(), 'r b');

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Supplier B']);
  });

  it('reflects the selected supplier from props', () => {
    render(
      <SupplierFilter
        value={{ ...baseValue, supplierId: 'sup-2' }}
        suppliers={suppliers}
        onChange={onChange}
      />,
    );

    expect(field()).toHaveValue('Supplier B');
  });

  it('emits onChange with the picked supplierId', async () => {
    const user = userEvent.setup();
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} />);

    await user.type(field(), 'Supplier');
    await user.click(screen.getByRole('option', { name: 'Supplier A' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ supplierId: 'sup-1' }));
  });

  it('emits onChange with supplierId=undefined when the field is cleared', async () => {
    const user = userEvent.setup();
    render(
      <SupplierFilter
        value={{ ...baseValue, supplierId: 'sup-1' }}
        suppliers={suppliers}
        onChange={onChange}
      />,
    );

    await user.clear(field());

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ supplierId: undefined }));
  });

  it('keeps the field enabled while suppliers load', () => {
    render(<SupplierFilter value={baseValue} suppliers={suppliers} onChange={onChange} disabled />);

    expect(field()).toBeEnabled();
  });

  it('shows no matches for an empty suppliers list', async () => {
    const user = userEvent.setup();
    render(<SupplierFilter value={baseValue} suppliers={[]} onChange={onChange} />);

    await user.type(field(), 'Supplier');

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No suppliers found')).toBeInTheDocument();
  });
});
