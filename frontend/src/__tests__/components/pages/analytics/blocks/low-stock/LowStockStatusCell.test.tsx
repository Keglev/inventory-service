/**
 * @file LowStockStatusCell.test.tsx
 * @module __tests__/components/pages/analytics/blocks/low-stock/LowStockStatusCell
 * @description
 * Enterprise unit tests for LowStockStatusCell.
 *
 * Contract:
 * - Renders a status Chip whose label and semantic color reflect the deficit.
 * - We treat Chip color classes as a UX contract (status must be visually scannable).
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LowStockStatusCell } from '@/pages/analytics/blocks/low-stock/LowStockStatusCell';

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
// Test helpers
// -----------------------------------------------------------------------------

function setup(deficit: number) {
  return render(<LowStockStatusCell deficit={deficit} />);
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('LowStockStatusCell', () => {
  it('renders the expected label and semantic color per deficit level', () => {
    const cases: Array<{ deficit: number; label: string; chipColorClass: string }> = [
      { deficit: 7, label: 'Critical', chipColorClass: 'MuiChip-colorError' },
      { deficit: 2, label: 'Warning', chipColorClass: 'MuiChip-colorWarning' },
      { deficit: 0, label: 'OK', chipColorClass: 'MuiChip-colorSuccess' },
    ];

    for (const c of cases) {
      setup(c.deficit);

      const chip = screen.getByText(c.label).closest('.MuiChip-root');
      expect(chip, `Chip should render for label "${c.label}"`).not.toBeNull();
      expect(chip as HTMLElement).toHaveClass(c.chipColorClass);
    }
  });
});
