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

import { render, act, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTheme, useTheme } from '@mui/material/styles';
import AppShell from '@/app/layout/AppShell';
import { ShellPreferencesProvider } from '@/context/shellPreferences/ShellPreferencesContext';
import { useToast } from '@/context/toast/ToastContext';

/**
 * Child props capture:
 * We stub child components and capture the props AppShell passes down.
 * This allows us to validate orchestration and wiring without coupling to child internals.
 */
type HeaderProps = {
  helpTopic: string;
  onDrawerToggle: () => void;
  onLogout: () => void;
  onSettingsOpen: () => void;
  onAboutOpen: () => void;
};

type SidebarProps = {
  mobileOpen: boolean;
  onMobileClose?: () => void;
};

let lastHeaderProps: Partial<HeaderProps> | undefined;
let lastSidebarProps: Partial<SidebarProps> | undefined;
let lastSettingsDialogProps: { open: boolean; onClose?: () => void } | undefined;

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

// Reads the theme it is rendered under, so a test can see which theme AppShell applied.
vi.mock('@/app/layout/AppMain', () => ({
  default: function AppMainStub() {
    const theme = useTheme();
    return <div data-testid="app-main" data-mode={theme.palette.mode}>main</div>;
  },
}));

// The real dialog toasts through ToastContext (useShellSettings); the stub does the
// same so the Snackbar wiring can be exercised.
vi.mock('@/app/settings/AppSettingsDialog', () => ({
  default: function SettingsDialogStub(props: { open: boolean; onClose?: () => void }) {
    lastSettingsDialogProps = props;
    const toast = useToast();
    return (
      <div data-testid="settings-dialog" data-open={props.open}>
        <button type="button" onClick={() => toast('common:shell.darkModeEnabled', 'info')}>
          toast
        </button>
      </div>
    );
  },
}));

let lastAboutDialogProps: { open: boolean; onClose?: () => void } | undefined;

// Stubbed: the real dialog reads the shared health query (needs a QueryClient).
vi.mock('@/app/about/AboutDialog', () => ({
  default: (props: { open: boolean; onClose?: () => void }) => {
    lastAboutDialogProps = props;
    return <div data-testid="about-dialog" data-open={props.open} />;
  },
}));

vi.mock('@/app/footer/AppFooter', () => ({
  default: () => <footer data-testid="app-footer" />,
}));

/**
 * Help panel:
 * Stubbed because the real component calls useHelp, which throws outside
 * HelpProvider (mounted in App.tsx, not in this test tree).
 */
vi.mock('@/components/help/HelpPanel', () => ({
  default: () => <div data-testid="help-panel" />,
}));

/**
 * Theme:
 * AppShell depends on a theme builder. We return a valid MUI theme instance.
 */
const mockBuildTheme = vi.hoisted(() => vi.fn());
vi.mock('@/theme', () => ({
  buildTheme: (...args: unknown[]) => {
    mockBuildTheme(...args);
    return createTheme({ palette: { mode: args[1] as 'light' | 'dark' } });
  },
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

vi.mock('@/features/auth/hooks/useSessionTimeout', () => ({
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
  // Locale and theme state live in the provider (FW5 fork 4); it reads the same fake i18n.
  return render(
    <ShellPreferencesProvider>
      <AppShell />
    </ShellPreferencesProvider>,
  );
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
    lastSettingsDialogProps = undefined;
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

  it('applies the theme built from the shared preferences', () => {
    // Theme state lives in ShellPreferencesProvider; AppShell only applies it.
    localStorage.setItem('themeMode', 'dark');
    renderAppShell();

    expect(mockBuildTheme).toHaveBeenLastCalledWith('de', 'dark');
    expect(screen.getByTestId('app-main')).toHaveAttribute('data-mode', 'dark');
  });

  it('passes no language or theme handlers to the header', () => {
    // Preferences are edited in the settings dialog only (FW5 forks 1 and 2).
    renderAppShell();

    expect(Object.keys(lastHeaderProps ?? {})).toEqual(
      expect.not.arrayContaining(['onLocaleChange', 'onThemeModeChange', 'locale', 'themeMode']),
    );
    expect(typeof getHeader().onSettingsOpen).toBe('function');
  });

  it('closes the mobile drawer through the sidebar callback', () => {
    renderAppShell();

    act(() => {
      getHeader().onDrawerToggle();
    });
    expect(getSidebar().mobileOpen).toBe(true);

    act(() => {
      getSidebar().onMobileClose?.();
    });

    expect(getSidebar().mobileOpen).toBe(false);
  });

  it('opens and closes the settings dialog through the wired callbacks', () => {
    renderAppShell();

    expect(screen.getByTestId('settings-dialog')).toHaveAttribute('data-open', 'false');

    act(() => {
      getHeader().onSettingsOpen();
    });
    expect(screen.getByTestId('settings-dialog')).toHaveAttribute('data-open', 'true');

    act(() => {
      lastSettingsDialogProps?.onClose?.();
    });
    expect(screen.getByTestId('settings-dialog')).toHaveAttribute('data-open', 'false');
  });

  it('opens and closes the About dialog through the wired callbacks', () => {
    renderAppShell();

    expect(screen.getByTestId('about-dialog')).toHaveAttribute('data-open', 'false');

    act(() => {
      getHeader().onAboutOpen();
    });
    expect(screen.getByTestId('about-dialog')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('settings-dialog')).toHaveAttribute('data-open', 'false');

    act(() => {
      lastAboutDialogProps?.onClose?.();
    });
    expect(screen.getByTestId('about-dialog')).toHaveAttribute('data-open', 'false');
  });

  it('auto-dismisses the confirmation toast via the snackbar close handler', async () => {
    renderAppShell();

    // A child (the settings dialog) raises a toast through ToastContext.
    fireEvent.click(screen.getByRole('button', { name: 'toast' }));
    expect(screen.getByText('common:shell.darkModeEnabled')).toBeInTheDocument();

    // MUI Snackbar close: fire the document clickaway path via its onClose.
    await waitFor(() => {
      const snackbarRoot = document.querySelector('.MuiSnackbar-root');
      expect(snackbarRoot).not.toBeNull();
    });
    fireEvent.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('common:shell.darkModeEnabled')).not.toBeInTheDocument();
    });
  });
});
