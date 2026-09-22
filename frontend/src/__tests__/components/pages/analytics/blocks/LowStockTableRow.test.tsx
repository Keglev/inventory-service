/**
 * @file LowStockTableRow.test.tsx
 * @module __tests__/components/pages/analytics/blocks/LowStockTableRow
 * @description Contract tests for the low-stock row severity mapping.
 *
 * Contract under test:
 * - quantity at or below half the minimum renders the Critical chip.
 * - quantity above half the minimum and below it renders the Warning chip.
 * - quantity at the minimum renders the OK chip.
 * - The band follows the minimum, not the size of the deficit.
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
  it('renders the Critical chip for an empty stock', () => {
    renderRow({ ...base, quantity: 0, minimumQuantity: 5, deficit: 5 });
    expect(screen.getByText(tEn('analytics:lowStock.status.critical'))).toBeInTheDocument();
  });

  it('renders the Warning chip above half the minimum', () => {
    renderRow({ ...base, quantity: 4, minimumQuantity: 5, deficit: 1 });
    expect(screen.getByText(tEn('analytics:lowStock.status.warning'))).toBeInTheDocument();
  });

  it('follows the minimum rather than the deficit: minimum 25 is Warning at 13', () => {
    renderRow({ ...base, quantity: 13, minimumQuantity: 25, deficit: 12 });
    expect(screen.getByText(tEn('analytics:lowStock.status.warning'))).toBeInTheDocument();
  });

  it('renders the Critical chip at half the minimum: minimum 25 at 12', () => {
    renderRow({ ...base, quantity: 12, minimumQuantity: 25, deficit: 13 });
    expect(screen.getByText(tEn('analytics:lowStock.status.critical'))).toBeInTheDocument();
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
