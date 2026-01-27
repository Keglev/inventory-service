/**
 * @file PublicShellHeader.rendering.test.tsx
 * @module __tests__/app/public-shell/header/PublicShellHeader.rendering
 * @description
 * Rendering and orchestration tests for PublicShellHeader.
 *
 * Scope:
 * - Renders AppBar + Toolbar containers and app title
 * - Wires props down to ThemeToggle and LanguageToggle
 *
 * Out of scope:
 * - Theme application logic (e.g., MUI theme provider)
 * - i18n persistence / i18next integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PublicShellHeader from '../../../../app/public-shell/header/PublicShellHeader';

type ThemeMode = 'light' | 'dark';
type Locale = 'de' | 'en';

type ThemeToggleProps = {
  themeMode: ThemeMode;
  onThemeToggle: () => void;
  tooltip?: string;
};

type LanguageToggleProps = {
  locale: Locale;
  onToggle: () => void;
  tooltip: string;
};

let lastThemeProps: Partial<ThemeToggleProps> | undefined;
let lastLanguageProps: Partial<LanguageToggleProps> | undefined;

/**
 * Child component stubs:
 * We capture props to validate orchestrated wiring from PublicShellHeader.
 */
vi.mock('../../../../app/public-shell/header/ThemeToggle', () => ({
  default: (props: Partial<ThemeToggleProps>) => {
    lastThemeProps = props;
    return <button data-testid="theme-toggle" type="button" />;
  },
}));

vi.mock('../../../../app/public-shell/header/LanguageToggle', () => ({
  default: (props: Partial<LanguageToggleProps>) => {
    lastLanguageProps = props;
    return <button data-testid="language-toggle" type="button" />;
  },
}));

type HeaderProps = React.ComponentProps<typeof PublicShellHeader>;

describe('PublicShellHeader (rendering)', () => {
  const baseProps: HeaderProps = {
    appTitle: 'Test App',
    themeMode: 'light',
    onThemeToggle: vi.fn(),
    locale: 'en',
    onLocaleToggle: vi.fn(),
    languageTooltip: 'Toggle language',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    lastThemeProps = undefined;
    lastLanguageProps = undefined;
  });

  function renderHeader(props: Partial<HeaderProps> = {}) {
    return render(<PublicShellHeader {...baseProps} {...props} />);
  }

  it('renders AppBar + Toolbar containers and the application title', () => {
    // Structural layout contract: header is an AppBar with a Toolbar and title text.
    const { container } = renderHeader({ appTitle: 'Smart Supply Pro' });

    expect(container.querySelector('.MuiAppBar-root')).toBeInTheDocument();
    expect(container.querySelector('.MuiToolbar-root')).toBeInTheDocument();
    expect(screen.getByText('Smart Supply Pro')).toBeInTheDocument();

    // Typography presence indicates title is rendered with MUI Text component.
    expect(container.querySelector('.MuiTypography-root')).toBeInTheDocument();
  });

  it('renders the ThemeToggle and LanguageToggle controls', () => {
    // Ensures both user controls are available in the public shell header.
    renderHeader();

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
  });

  it('passes themeMode and callback into ThemeToggle', () => {
    // Validates orchestrated wiring rather than testing ThemeToggle itself.
    renderHeader({ themeMode: 'dark' });

    expect(lastThemeProps).toMatchObject({
      themeMode: 'dark',
    });
    expect(typeof lastThemeProps?.onThemeToggle).toBe('function');
  });

  it('passes locale, tooltip and callback into LanguageToggle', () => {
    // Validates orchestrated wiring rather than testing LanguageToggle itself.
    renderHeader({ locale: 'de', languageTooltip: 'Switch language' });

    expect(lastLanguageProps).toMatchObject({
      locale: 'de',
      tooltip: 'Switch language',
    });
    expect(typeof lastLanguageProps?.onToggle).toBe('function');
  });
});
