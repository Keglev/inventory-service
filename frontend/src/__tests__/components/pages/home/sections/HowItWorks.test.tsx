/**
 * @file HowItWorks.test.tsx
 * @module __tests__/components/pages/home/sections/HowItWorks
 * @testing Vitest + Testing Library, mocked i18n resolving the English landing JSON.
 * @description Tests for the three-step orientation block on the landing page.
 *
 * Contract under test:
 * - Renders three steps, numbered 1..3 from the array index rather than from copy.
 * - Step titles resolve from the landing namespace.
 *
 * Out of scope: avatar styling and grid collapse behaviour.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import HowItWorks from '../../../../../pages/home/sections/HowItWorks';
import { tEn } from '../../../../test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

describe('HowItWorks', () => {
  it('renders three numbered steps with their titles', () => {
    render(<HowItWorks />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('How it works');

    const titles = screen.getAllByRole('heading', { level: 3 }).map((n) => n.textContent);
    expect(titles).toEqual([
      'Sign in or open the demo',
      'Track stock and suppliers',
      'Read the numbers',
    ]);

    ['1', '2', '3'].forEach((numeral) => {
      expect(screen.getByText(numeral)).toBeInTheDocument();
    });
  });
});
