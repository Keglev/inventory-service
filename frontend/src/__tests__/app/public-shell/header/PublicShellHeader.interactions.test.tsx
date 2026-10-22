/**
 * @file PublicShellHeader.interactions.test.tsx
 * @module __tests__/app/public-shell/header/PublicShellHeader.interactions
 * @description
 * Interaction tests for PublicShellHeader.
 *
 * Scope:
 * - Delegates user interactions from child toggles to parent handlers:
 *   onThemeToggle and onLocaleToggle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicShellHeader from '@/app/public-shell/header/PublicShellHeader';
import type { ThemeToggleProps } from '@/app/public-shell/header/ThemeToggle';
import type { LanguageToggleProps } from '@/app/public-shell/header/LanguageToggle';
import { makeHeaderProps, type HeaderProps } from '@/__tests__/app/public-shell/header/fixtures';


/**
 * Interactive stubs:
 * Buttons call through to the callbacks passed by PublicShellHeader.
 */
vi.mock('@/app/public-shell/header/ThemeToggle', () => ({
  default: ({ onToggle }: Partial<ThemeToggleProps>) => (
    <button type="button" data-testid="theme-toggle" onClick={onToggle}>
      Theme
    </button>
  ),
}));

vi.mock('@/app/public-shell/header/LanguageToggle', () => ({
  default: ({ onToggle }: Partial<LanguageToggleProps>) => (
    <button type="button" data-testid="language-toggle" onClick={onToggle}>
      Lang
    </button>
  ),
}));

describe('PublicShellHeader (interactions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderHeader(props: Partial<HeaderProps> = {}) {
    const baseProps: HeaderProps = makeHeaderProps();

    return render(<PublicShellHeader {...baseProps} {...props} />);
  }

  it('calls onThemeToggle when the theme control is activated', async () => {
    // Ensures the theme toggle is wired end-to-end.
    const user = userEvent.setup();
    const onThemeToggle = vi.fn();

    renderHeader({ onThemeToggle });

    await user.click(screen.getByTestId('theme-toggle'));

    expect(onThemeToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onLocaleToggle when the language control is activated', async () => {
    // Ensures the language toggle is wired end-to-end.
    const user = userEvent.setup();
    const onLocaleToggle = vi.fn();

    renderHeader({ onLocaleToggle });

    await user.click(screen.getByTestId('language-toggle'));

    expect(onLocaleToggle).toHaveBeenCalledTimes(1);
  });
});
