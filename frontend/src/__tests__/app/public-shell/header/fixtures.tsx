/**
 * @file fixtures.tsx
 * @module __tests__/app/public-shell/header/fixtures
 * @description Shared fixtures (fork 4 A, 2026-10-22) for the split header
 * suites: the LanguageToggle render helper and the PublicShellHeader props
 * that the rendering and interactions specs each built.
 * Consumers: LanguageToggle.rendering / .interactions,
 * PublicShellHeader.rendering / .interactions.
 */
import type * as React from 'react';
import { vi } from 'vitest';
import { render } from '@testing-library/react';

import LanguageToggle from '@/app/public-shell/header/LanguageToggle';
import type PublicShellHeader from '@/app/public-shell/header/PublicShellHeader';

type LanguageToggleTestProps = React.ComponentProps<typeof LanguageToggle>;

/** Renders LanguageToggle with German as the current locale unless overridden. */
export function renderToggle(props: Partial<LanguageToggleTestProps> = {}) {
  const merged: LanguageToggleTestProps = {
    locale: 'de',
    onToggle: vi.fn(),
    tooltip: 'Switch language',
    ...props,
  };
  return render(<LanguageToggle {...merged} />);
}

export type HeaderProps = React.ComponentProps<typeof PublicShellHeader>;

/** PublicShellHeader props with fresh spies for both toggles. */
export function makeHeaderProps(): HeaderProps {
  return {
    appTitle: 'Test App',
    themeMode: 'light',
    onThemeToggle: vi.fn(),
    locale: 'en',
    onLocaleToggle: vi.fn(),
    languageTooltip: 'Switch language',
  };
}
