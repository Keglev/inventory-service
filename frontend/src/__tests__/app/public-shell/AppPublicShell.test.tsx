/**
 * @file AppPublicShell.test.tsx
 * @module __tests__/app/public-shell/AppPublicShell
 * @description
 * Tests for AppPublicShell.
 *
 * Scope:
 * - Renders the public shell structure (header, content, toast container)
 * - Orchestrates theme, locale, and toast state via custom hooks
 * - Wires handler callbacks into the header and toast container props
 *
 * Out of scope:
 * - Actual theme palette generation / ThemeProvider internals
 * - i18next implementation details and resource loading
 * - Nested route/page behavior in PublicShellContent
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AppPublicShell from '../../../app/public-shell/AppPublicShell';
import { ToastContext } from '../../../context/toast';

/* ----------------------------- i18n stub ----------------------------- */
// Keep translation deterministic; component only needs i18n object presence.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
    t: (key: string) => key,
  }),
}));

/* ------------------------- Hook orchestration ------------------------- */
const mockToggleThemeMode = vi.hoisted(() => vi.fn());
const mockToggleLocale = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockHideToast = vi.hoisted(() => vi.fn());
const mockSetToast = vi.hoisted(() => vi.fn());

const mockUseThemeMode = vi.hoisted(() => vi.fn());
const mockUseLocale = vi.hoisted(() => vi.fn());
const mockUsePublicShellToast = vi.hoisted(() => vi.fn());

vi.mock('../../../app/public-shell/hooks', () => ({
  useThemeMode: () => mockUseThemeMode(),
  useLocale: () => mockUseLocale(),
  usePublicShellToast: () => mockUsePublicShellToast(),
}));

/* ----------------------- Child component stubs ------------------------ */
// Capture props passed into header and toast container for wiring assertions.
let lastHeaderProps: Record<string, unknown> | undefined;
let lastToastProps: Record<string, unknown> | undefined;

vi.mock('../../../app/public-shell/header', () => ({
  PublicShellHeader: (props: Record<string, unknown>) => {
    lastHeaderProps = props;
    return <header data-testid="public-shell-header">Header</header>;
  },
}));

vi.mock('../../../app/public-shell/PublicShellContent', () => ({
  default: function PublicShellContentMock() {
    const toast = React.useContext(ToastContext);

    return (
      <main data-testid="public-shell-content">
        <button type="button" data-testid="trigger-toast" onClick={() => toast('Hi')}>
          Trigger toast
        </button>
      </main>
    );
  },
}));

vi.mock('../../../app/public-shell/PublicShellToastContainer', () => ({
  default: (props: Record<string, unknown>) => {
    lastToastProps = props;
    return <div data-testid="toast-container" />;
  },
}));

// Theme builder is not under test here; it just needs to return a valid object.
vi.mock('../../theme', () => ({
  buildTheme: () => ({}),
}));

describe('AppPublicShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lastHeaderProps = undefined;
    lastToastProps = undefined;

    // Default hook return values for most tests.
    mockUseThemeMode.mockReturnValue({
      themeMode: 'light',
      toggleThemeMode: mockToggleThemeMode,
    });
    mockUseLocale.mockReturnValue({
      locale: 'en',
      toggleLocale: mockToggleLocale,
    });
    mockUsePublicShellToast.mockReturnValue({
      toast: null,
      showToast: mockShowToast,
      hideToast: mockHideToast,
      setToast: mockSetToast,
    });
  });

  function renderShell() {
    return render(
      <BrowserRouter>
        <AppPublicShell />
      </BrowserRouter>,
    );
  }

  it('renders header, content, and toast container', () => {
    // Smoke test: public shell composes all primary regions.
    renderShell();

    expect(screen.getByTestId('public-shell-header')).toBeInTheDocument();
    expect(screen.getByTestId('public-shell-content')).toBeInTheDocument();
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('wires theme and locale state into the header', () => {
    // Orchestration contract: header receives the current theme + locale values.
    mockUseThemeMode.mockReturnValue({
      themeMode: 'dark',
      toggleThemeMode: mockToggleThemeMode,
    });
    mockUseLocale.mockReturnValue({
      locale: 'de',
      toggleLocale: mockToggleLocale,
    });

    renderShell();

    expect(lastHeaderProps).toMatchObject({
      themeMode: 'dark',
      locale: 'de',
    });

    // Handler props are delegated from hook outputs.
    expect(typeof lastHeaderProps?.onThemeToggle).toBe('function');
    expect(typeof lastHeaderProps?.onLocaleToggle).toBe('function');
  });

  it.each([
    { locale: 'en', expectedMsg: 'Language: English' },
    { locale: 'de', expectedMsg: 'Sprache: Deutsch' },
  ])('invokes the locale toggle handler (locale=$locale)', ({ locale, expectedMsg }) => {
    mockUseLocale.mockReturnValue({
      locale,
      toggleLocale: mockToggleLocale,
    });

    renderShell();

    const onLocaleToggle = lastHeaderProps?.onLocaleToggle as undefined | (() => void);
    expect(typeof onLocaleToggle).toBe('function');

    onLocaleToggle?.();

    expect(mockToggleLocale).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith(expectedMsg, 'info');
  });

  it.each([
    { themeMode: 'light', expectedMsg: 'Dark mode enabled' },
    { themeMode: 'dark', expectedMsg: 'Light mode enabled' },
  ])('invokes the theme toggle handler (themeMode=$themeMode)', ({ themeMode, expectedMsg }) => {
    mockUseThemeMode.mockReturnValue({
      themeMode,
      toggleThemeMode: mockToggleThemeMode,
    });

    renderShell();

    const onThemeToggle = lastHeaderProps?.onThemeToggle as undefined | (() => void);
    expect(typeof onThemeToggle).toBe('function');

    onThemeToggle?.();

    expect(mockToggleThemeMode).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith(expectedMsg, 'info');
  });

  it('invokes the ToastContext callback (default severity)', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByTestId('trigger-toast'));

    expect(mockSetToast).toHaveBeenCalledWith({
      open: true,
      msg: 'Hi',
      severity: 'success',
    });
  });

  it('wires toast state into the toast container', () => {
    // Orchestration contract: toast container receives the current toast object.
    const toast = { open: true, msg: 'Saved', severity: 'success' };
    mockUsePublicShellToast.mockReturnValue({
      toast,
      showToast: mockShowToast,
      hideToast: mockHideToast,
      setToast: vi.fn(),
    });

    renderShell();

    expect(lastToastProps).toMatchObject({ toast });
  });

  it('provides the expected MUI layout container', () => {
    // Layout contract: outer shell uses MUI Box root for consistent spacing/layout.
    const { container } = renderShell();

    expect(container.querySelector('.MuiBox-root')).toBeInTheDocument();
  });
});
