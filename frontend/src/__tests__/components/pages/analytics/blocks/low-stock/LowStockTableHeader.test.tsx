/**
 * @file LowStockTableHeader.test.tsx
 * @module __tests__/pages/analytics/low-stock/LowStockTableHeader
 *
 * @summary
 * Tests header labels for the low stock table.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LowStockTableHeader } from '../../../../../../pages/analytics/blocks/low-stock/LowStockTableHeader';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

describe('LowStockTableHeader', () => {
  it('renders all column headers with fallback labels', () => {
    render(
      <table>
        <LowStockTableHeader />
      </table>
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(5);
    expect(headers.map((h) => h.textContent)).toEqual([
      'Item',
      'Quantity',
      'Minimum',
      'Deficit',
      'Status',
    ]);
  });
});
