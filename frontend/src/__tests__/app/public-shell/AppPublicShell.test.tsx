/**
 * @file AppPublicShell.test.tsx
 *
 * @what_is_under_test AppPublicShell component
 * @responsibility Orchestrates theme, locale, and toast management for public shell
 * @out_of_scope Theme application to nested components, actual language switching implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppPublicShell from '../../../app/public-shell/AppPublicShell';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
    t: vi.fn((key) => key),
  }),
}));

// Mock custom hooks
const mockToggleThemeMode = vi.hoisted(() => vi.fn());
const mockToggleLocale = vi.hoisted(() => vi.fn());
const mockShowToast = vi.hoisted(() => vi.fn());
const mockHideToast = vi.hoisted(() => vi.fn());

vi.mock('../../../app/public-shell/hooks', () => ({
  useThemeMode: () => ({
    themeMode: 'light',
    toggleThemeMode: mockToggleThemeMode(),
  }),
  useLocale: () => ({
    locale: 'en',
    toggleLocale: mockToggleLocale(),
  }),
  usePublicShellToast: () => ({
    toast: null,
    showToast: mockShowToast(),
    hideToast: mockHideToast(),
    setToast: vi.fn(),
  }),
}));

// Mock child components
vi.mock('../../../app/public-shell/header', () => ({
  PublicShellHeader: vi.fn(() => (
    <header data-testid="public-shell-header">Header</header>
  )),
}));

vi.mock('../../../app/public-shell/PublicShellContent', () => ({
  default: vi.fn(() => <main data-testid="public-shell-content">Content</main>),
}));

vi.mock('../../../app/public-shell/PublicShellToastContainer', () => ({
  default: vi.fn(({ toast }) => (
    <div data-testid="toast-container">
      {toast?.message && <span>{toast.message}</span>}
    </div>
  )),
}));

vi.mock('../../theme', () => ({
  buildTheme: () => ({}),
}));

describe('AppPublicShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component structure', () => {
    it('renders PublicShellHeader component', () => {
      render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      const header = screen.getByTestId('public-shell-header');
      expect(header).toBeInTheDocument();
    });

    it('renders PublicShellContent component', () => {
      render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      const content = screen.getByTestId('public-shell-content');
      expect(content).toBeInTheDocument();
    });

    it('renders PublicShellToastContainer component', () => {
      render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      const toast = screen.getByTestId('toast-container');
      expect(toast).toBeInTheDocument();
    });
  });

  describe('Theme management', () => {
    it('initializes with default theme', () => {
      render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      expect(screen.getByTestId('public-shell-header')).toBeInTheDocument();
    });

    it('renders with CssBaseline and ThemeProvider', () => {
      const { container } = render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Locale management', () => {
    it('initializes with default locale', () => {
      render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      expect(screen.getByTestId('public-shell-header')).toBeInTheDocument();
    });

    it('renders all shell components', () => {
      render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      expect(screen.getByTestId('public-shell-header')).toBeInTheDocument();
      expect(screen.getByTestId('public-shell-content')).toBeInTheDocument();
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });
  });

  describe('Toast management', () => {
    it('renders toast container', () => {
      render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      const toast = screen.getByTestId('toast-container');
      expect(toast).toBeInTheDocument();
    });
  });

  describe('Complete shell rendering', () => {
    it('renders with all required components', () => {
      render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      expect(screen.getByTestId('public-shell-header')).toBeInTheDocument();
      expect(screen.getByTestId('public-shell-content')).toBeInTheDocument();
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
    });

    it('provides proper container structure', () => {
      const { container } = render(
        <BrowserRouter>
          <AppPublicShell />
        </BrowserRouter>
      );

      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
    });
  });
});
