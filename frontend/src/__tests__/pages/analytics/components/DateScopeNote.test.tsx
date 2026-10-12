/**
 * @file DateScopeNote.test.tsx
 * @module __tests__/pages/analytics/components/DateScopeNote
 * @testing DateScopeNote
 * @description The caption says whether a card shows a current snapshot or an
 *   all-time count, so a card under the date filter does not claim a date range.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { tEn } from '@/__tests__/test/i18nEn';
import DateScopeNote from '@/pages/analytics/components/DateScopeNote';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => tEn(key) }),
}));

describe('DateScopeNote', () => {
  it('names the current snapshot when kind is current', () => {
    render(<DateScopeNote kind="current" />);
    expect(screen.getByTestId('date-scope-note')).toHaveTextContent('Current stock – not limited by the date range');
  });

  it('names the all-time count when kind is allTime', () => {
    render(<DateScopeNote kind="allTime" />);
    expect(screen.getByTestId('date-scope-note')).toHaveTextContent('All time – not limited by the date range');
  });
});
