/**
 * @file HeroSection.test.tsx
 * @module __tests__/components/pages/home/sections/HeroSection
 * @testing Vitest + Testing Library, mocked i18n resolving the English landing JSON.
 * @description Tests for the landing hero block.
 *
 * Contract under test:
 * - Renders the value proposition as the page's level-1 heading plus supporting copy.
 * - Invokes the injected demo and sign-in handlers; owns no navigation itself.
 * - Renders the product preview image and degrades to a text placeholder when the
 *   optional screenshot asset fails to load.
 *
 * Out of scope: layout, theming, and the routing performed by the Home orchestrator.
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HeroSection from '../../../../../pages/home/sections/HeroSection';
import { tEn } from '../../../../test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

describe('HeroSection', () => {
  it('renders the value proposition and the demo disclaimer', () => {
    render(<HeroSection onDemo={vi.fn()} onSignIn={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Know what you hold, what it cost, and what moved.',
    );
    expect(
      screen.getByText(/read-only session against the live API/i),
    ).toBeInTheDocument();
  });

  it('calls the injected handlers for both entry actions', async () => {
    const user = userEvent.setup();
    const onDemo = vi.fn();
    const onSignIn = vi.fn();

    render(<HeroSection onDemo={onDemo} onSignIn={onSignIn} />);

    await user.click(screen.getByRole('button', { name: /explore the live demo/i }));
    await user.click(screen.getByRole('button', { name: /sign in with google/i }));

    expect(onDemo).toHaveBeenCalledTimes(1);
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it('falls back to placeholder copy when the preview asset fails to load', () => {
    render(<HeroSection onDemo={vi.fn()} onSignIn={vi.fn()} />);

    const preview = screen.getByAltText('SmartSupplyPro dashboard preview');
    fireEvent.error(preview);

    expect(screen.queryByAltText('SmartSupplyPro dashboard preview')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard preview')).toBeInTheDocument();
  });
});
