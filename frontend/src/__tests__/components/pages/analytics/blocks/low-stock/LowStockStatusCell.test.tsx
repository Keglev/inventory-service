/**
 * @file LowStockStatusCell.test.tsx
 * @module __tests__/pages/analytics/low-stock/LowStockStatusCell
 *
 * @summary
 * Tests for LowStockStatusCell covering visual state per deficit level.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LowStockStatusCell } from '../../../../../../pages/analytics/blocks/low-stock/LowStockStatusCell';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

describe('LowStockStatusCell', () => {
  const renderCell = (deficit: number) => render(<LowStockStatusCell deficit={deficit} />);

  it('renders critical status for large deficits', () => {
    renderCell(7);

    const chip = screen.getByText('Critical').closest('.MuiChip-root');
    expect(chip).not.toBeNull();
    expect(chip).toHaveClass('MuiChip-colorError');
  });

  it('renders warning status for moderate deficits', () => {
    renderCell(2);

    const chip = screen.getByText('Warning').closest('.MuiChip-root');
    expect(chip).not.toBeNull();
    expect(chip).toHaveClass('MuiChip-colorWarning');
  });

  it('renders ok status when there is no deficit', () => {
    renderCell(0);

    const chip = screen.getByText('OK').closest('.MuiChip-root');
    expect(chip).not.toBeNull();
    expect(chip).toHaveClass('MuiChip-colorSuccess');
  });
});
