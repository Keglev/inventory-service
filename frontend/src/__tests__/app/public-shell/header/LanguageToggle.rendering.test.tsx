/**
 * @file LanguageToggle.rendering.test.tsx
 * @module __tests__/app/public-shell/header/LanguageToggle.rendering
 * @description
 * Rendering and accessibility tests for LanguageToggle.
 *
 * Scope:
 * - Names the target language in that language, as text, with lang set (FW5 fork 2)
 * - Renders no flag image (W3C i18n: flags stand for countries, not languages)
 * - Ensures baseline accessibility (button role)
 *
 * Out of scope:
 * - Tooltip behavior and user interactions (covered in LanguageToggle.interactions.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LanguageToggle from '@/app/public-shell/header/LanguageToggle';

type Props = React.ComponentProps<typeof LanguageToggle>;

describe('LanguageToggle (rendering)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderToggle(props: Partial<Props> = {}) {
    const merged: Props = {
      locale: 'de',
      onToggle: vi.fn(),
      tooltip: 'Switch language',
      ...props,
    };
    return render(<LanguageToggle {...merged} />);
  }

  it('renders as a button (accessible role)', () => {
    // Accessibility contract: control must be reachable via role="button".
    renderToggle();

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('offers English, in English, when locale=de', () => {
    renderToggle({ locale: 'de' });
    const button = screen.getByRole('button', { name: 'English' });
    expect(button).toHaveAttribute('lang', 'en');
  });

  it('offers Deutsch, in German, when locale=en', () => {
    renderToggle({ locale: 'en' });
    const button = screen.getByRole('button', { name: 'Deutsch' });
    expect(button).toHaveAttribute('lang', 'de');
  });

  it('updates the label when the locale prop changes', () => {
    // Guards against stale props in memoized components.
    const { rerender } = renderToggle({ locale: 'de' });
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();

    rerender(
      <LanguageToggle locale="en" onToggle={vi.fn()} tooltip="Switch language" />,
    );
    expect(screen.getByRole('button', { name: 'Deutsch' })).toBeInTheDocument();
  });

  it('renders no flag image', () => {
    // Paired presence: the text button rendered.
    const { container } = renderToggle({ locale: 'de' });
    expect(screen.getByRole('button', { name: 'English' })).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });
});
