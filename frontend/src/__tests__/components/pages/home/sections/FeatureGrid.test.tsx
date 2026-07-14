/**
 * @file FeatureGrid.test.tsx
 * @module __tests__/components/pages/home/sections/FeatureGrid
 * @testing Vitest + Testing Library, mocked i18n resolving the English landing JSON.
 * @description Tests for the six-card capability grid on the landing page.
 *
 * Contract under test:
 * - Renders exactly six capability cards, each with a level-3 heading.
 * - Card titles come from the landing namespace, so a missing key surfaces as a
 *   raw key string rather than silently rendering an empty card.
 *
 * Out of scope: icon choice, card ordering as a visual concern, responsive columns.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import FeatureGrid from '../../../../../pages/home/sections/FeatureGrid';
import { tEn } from '../../../../test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

describe('FeatureGrid', () => {
  it('renders the section heading and six capability cards', () => {
    render(<FeatureGrid />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('What it does');

    const cardTitles = screen.getAllByRole('heading', { level: 3 }).map((n) => n.textContent);
    expect(cardTitles).toEqual([
      'Inventory',
      'Suppliers',
      'Financial analytics',
      'Audit trail',
      'Access control',
      'German and English',
    ]);
  });

  it('resolves card body copy from the landing namespace', () => {
    render(<FeatureGrid />);

    expect(screen.getByText(/soft delete gated on zero quantity/i)).toBeInTheDocument();
    expect(screen.getByText(/Weighted-average cost valuation/i)).toBeInTheDocument();
  });
});
