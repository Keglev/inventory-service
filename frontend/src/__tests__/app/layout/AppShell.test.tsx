/**
 * @file AppShell.test.tsx
 * @module __tests__/app/layout/AppShell
 * @description
 * Orchestration tests for the AppShell layout component.
 *
 * AppShell responsibilities (in scope):
 * - Compose header, sidebar, and main layout regions.
 * - Wire navigation help topic into header.
 * - Manage mobile drawer open/close state.
 * - Handle user actions (logout, locale change, theme toggle) and persist relevant preferences.
 *
 * Out of scope:
 * - Visual correctness of child components (AppHeader/AppSidebar/AppMain).
 * - MUI theme internals beyond "a theme is provided".
 */

import { render, act, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTheme } from '@mui/material/styles';
import AppShell from '@/app/layout/AppShell';

/**
 * Child props capture:
 * We stub child components and capture the props AppShell passes down.
 * This allows us to validate orchestration and wiring without coupling to child internals.
 */
type HeaderProps = {
  helpTopic: string;
  onDrawerToggle: () => void;
  onLogout: () => void;
  onLocaleChange: (locale: 'de' | 'en') => void;
  onThemeModeChange: (mode: 'light' | 'dark') => void;
};

type SidebarProps = {
  mobileOpen: boolean;
};

let lastHeaderProps: Partial<HeaderProps> | undefined;
let lastSidebarProps: Partial<SidebarProps> | undefined;

vi.mock('@/app/layout/AppHeader', () => ({
  default: (props: Partial<HeaderProps>) => {
    lastHeaderProps = props;
    return <div data-testid="app-header" />;
  },
}));

vi.mock('@/app/layout/AppSidebar', () => ({
  default: (props: Partial<SidebarProps>) => {
    lastSidebarProps = props;
    return <div data-testid="app-sidebar" />;
  },
}));

vi.mock('@/app/layout/AppMain', () => ({
  default: () => <div data-testid="app-main">main</div>,
}));

vi.mock('@/app/settings', () => ({
  AppSettingsDialog: (props: { open: boolean }) => (
    <div data-testid="settings-dialog" data-open={props.open} />
  ),
}));

/**
 * Theme:
 * AppShell depends on a theme builder. We return a valid MUI theme instance.
 */
vi.mock('@/theme', () => ({
  buildTheme: () => createTheme(),
}));

/**
 * Navigation help topic:
 * Provide a deterministic topic for assertions.
 */
vi.mock('@/app/layout/navConfig', () => ({
  getHelpTopicForRoute: () => 'test-topic',
}));

/**
 * i18n:
 * Keep translation stable by returning the key. Locale changes should call i18n.changeLanguage.
 */
const fakeI18n = {
  resolvedLanguage: 'de',
  changeLanguage: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
} as const;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: fakeI18n }),
}));

/**
 * Router + query + auth wiring.
 * - useNavigate: verify navigation after logout
 * - useLocation: deterministic route for help-topic lookup
 * - query client: verify cache clearing on logout
 * - auth: demo user + logout function
 */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

const mockQueryClient = { clear: vi.fn() };
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => mockQueryClient,
}));

vi.mock('@/features/auth', () => ({
  useSessionTimeout: vi.fn(),
}));

const mockLogout = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { isDemo: true }, logout: mockLogout }),
}));

// Prevent accidental access to real config in logout code paths.
vi.mock('@/api/httpClient', () => ({ API_BASE: '/api' }));

/** Test helpers */
function renderAppShell() {
  return render(<AppShell />);
}

function getHeader(): HeaderProps {
  // Fail fast with a clear error if the header did not render / props not captured.
  if (!lastHeaderProps) throw new Error('Expected AppHeader to be rendered and capture props.');
  return lastHeaderProps as HeaderProps;
}

function getSidebar(): SidebarProps {
  if (!lastSidebarProps) throw new Error('Expected AppSidebar to be rendered and capture props.');
  return lastSidebarProps as SidebarProps;
}

describe('AppShell', () => {
  beforeEach(() => {
    // Ensure test isolation across rerenders and storage mutations.
    vi.clearAllMocks();
    localStorage.clear();
    lastHeaderProps = undefined;
    lastSidebarProps = undefined;
  });

  it('renders the composed layout regions (header, sidebar, main)', () => {
    // Verifies AppShell composes the main layout building blocks.
    renderAppShell();

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('app-main')).toHaveTextContent('main');
  });

  it('wires help topic and drawer state handlers into header and sidebar', () => {
    // Validates the orchestration contract between AppShell and its children.
    renderAppShell();

    expect(getHeader().helpTopic).toBe('test-topic');
    expect(typeof getHeader().onDrawerToggle).toBe('function');
    expect(getSidebar().mobileOpen).toBe(false);
  });

  it('toggles the mobile drawer when the header menu toggle is invoked', () => {
    // Simulates the header "hamburger" action and ensures state flows to the sidebar.
    renderAppShell();

    act(() => {
      getHeader().onDrawerToggle();
    });

    expect(getSidebar().mobileOpen).toBe(true);
  });

  it('handles demo logout by clearing query cache and navigating to the success page', () => {
    // Demo logout path: clear client cache, call logout, and redirect.
    renderAppShell();

    act(() => {
      getHeader().onLogout();
    });

    expect(mockQueryClient.clear).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/logout-success', { replace: true });
  });

  it('changes locale, persists selection, and shows a confirmation toast', () => {
    // Locale changes should persist in localStorage and display a user-facing confirmation.
    renderAppShell();

    act(() => {
      getHeader().onLocaleChange('en');
    });

    expect(fakeI18n.changeLanguage).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
    expect(screen.getByText('Language: English')).toBeInTheDocument();
  });

  it('toggles theme mode and persists the preference', () => {
    // Theme changes should persist and provide immediate feedback.
    renderAppShell();

    act(() => {
      getHeader().onThemeModeChange('dark');
    });

    expect(localStorage.getItem('themeMode')).toBe('dark');
    expect(screen.getByText('Dark mode enabled')).toBeInTheDocument();
  });
});
