/**
 * @file LowStockTableRow.test.tsx
 * @module __tests__/components/pages/analytics/blocks/LowStockTableRow
 * @description Contract tests for the low-stock row severity mapping.
 *
 * Contract under test:
 * - deficit >= LOW_STOCK_CRITICAL_THRESHOLD (5) renders the Critical chip.
 * - 0 < deficit < threshold renders the Warning chip.
 * - deficit 0 renders the OK chip.
 * - Quantities render through the injected table-level formatter.
 *
 * Out of scope:
 * - Deficit computation and ordering (useLowStockRows suite).
 * - Table composition, header, and the shown-n-of-m footer (LowStockTable).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Table, TableBody } from '@mui/material';
import { LowStockTableRow } from '../../../../../pages/analytics/blocks/LowStockTableRow';
import type { LowStockDerivedRow } from '../../../../../pages/analytics/hooks/useLowStockRows';
import { tEn } from '../../../../test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

const formatQty = (v: number | undefined | null) => String(v ?? 0);

function renderRow(row: LowStockDerivedRow) {
  render(
    <Table>
      <TableBody>
        <LowStockTableRow row={row} formatQty={formatQty} />
      </TableBody>
    </Table>,
  );
}

const base = { itemName: 'Copper Wire', quantity: 0, minimumQuantity: 0 };

describe('LowStockTableRow', () => {
  it('renders the Critical chip at the threshold deficit', () => {
    renderRow({ ...base, quantity: 0, minimumQuantity: 5, deficit: 5 });
    expect(screen.getByText(tEn('analytics:lowStock.status.critical'))).toBeInTheDocument();
  });

  it('renders the Warning chip for a positive deficit below the threshold', () => {
    renderRow({ ...base, quantity: 4, minimumQuantity: 5, deficit: 1 });
    expect(screen.getByText(tEn('analytics:lowStock.status.warning'))).toBeInTheDocument();
  });

  it('renders the OK chip for a zero deficit', () => {
    renderRow({ ...base, quantity: 5, minimumQuantity: 5, deficit: 0 });
    expect(screen.getByText(tEn('analytics:lowStock.status.ok'))).toBeInTheDocument();
  });

  it('renders quantities through the injected formatter', () => {
    renderRow({ ...base, quantity: 3, minimumQuantity: 5, deficit: 2 });
    expect(screen.getByText('Copper Wire')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // quantity
    expect(screen.getByText('5')).toBeInTheDocument(); // minimum
    expect(screen.getByText('2')).toBeInTheDocument(); // deficit
  });
});
