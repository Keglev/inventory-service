/**
 * @file FinalCta.test.tsx
 * @module __tests__/components/pages/home/sections/FinalCta
 * @testing Vitest + Testing Library, mocked i18n resolving the English landing JSON.
 * @description Tests for the closing call to action on the landing page.
 *
 * Contract under test:
 * - Renders the closing heading and copy from the landing namespace.
 * - Delegates both entry actions to the injected handlers, so the bottom of the page
 *   cannot drift from the hero.
 *
 * Out of scope: panel tinting and responsive stacking.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FinalCta from '../../../../../pages/home/sections/FinalCta';
import { tEn } from '../../../../test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

describe('FinalCta', () => {
  it('renders the closing heading and copy', () => {
    render(<FinalCta onDemo={vi.fn()} onSignIn={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('See it with real data');
    expect(screen.getByText(/live and read-only/i)).toBeInTheDocument();
  });

  it('delegates both actions to the injected handlers', async () => {
    const user = userEvent.setup();
    const onDemo = vi.fn();
    const onSignIn = vi.fn();

    render(<FinalCta onDemo={onDemo} onSignIn={onSignIn} />);

    await user.click(screen.getByRole('button', { name: /open the demo/i }));
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));

    expect(onDemo).toHaveBeenCalledTimes(1);
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });
});
