/**
 * @file LowStockTableHeader.test.tsx
 * @module __tests__/components/pages/analytics/blocks/low-stock/LowStockTableHeader
 * @description
 * Enterprise unit tests for LowStockTableHeader.
 *
 * Contract:
 * - Renders the expected column header labels (fallback strings are used in tests).
 * - Header count and order are part of the table UX contract.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LowStockTableHeader } from '@/pages/analytics/blocks/low-stock/LowStockTableHeader';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Use fallback when provided to keep assertions language-agnostic.
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('LowStockTableHeader', () => {
  it('renders all column headers with fallback labels (count + order)', () => {
    // Table semantics: <th> roles are only correct within a table context.
    render(
      <table>
        <LowStockTableHeader />
      </table>,
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(5);
    expect(headers.map(h => h.textContent)).toEqual(['Item', 'Quantity', 'Minimum', 'Deficit', 'Status']);
  });
});
