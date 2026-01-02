import { render, act, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTheme } from '@mui/material/styles';
import AppShell from '@/app/layout/AppShell';

// Track props handed to child components for assertions.
let lastHeaderProps: Record<string, unknown> | undefined;
let lastSidebarProps: Record<string, unknown> | undefined;

// Stub subcomponents so we can inspect the orchestrated props.
vi.mock('@/app/layout/AppHeader', () => ({
  default: (props: Record<string, unknown>) => {
    lastHeaderProps = props;
    return <div data-testid="app-header" />;
  },
}));

vi.mock('@/app/layout/AppSidebar', () => ({
  default: (props: Record<string, unknown>) => {
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

// Mock theme builder to return a valid MUI theme.
vi.mock('@/theme', () => ({
  buildTheme: () => createTheme(),
}));

// Mock nav help lookup to a fixed topic.
vi.mock('@/app/layout/navConfig', () => ({
  getHelpTopicForRoute: () => 'test-topic',
}));

// Mock translation with minimal i18n implementation.
const listeners: Record<string, Array<(lng: string) => void>> = { languageChanged: [] };
const fakeI18n = {
  resolvedLanguage: 'de',
  changeLanguage: vi.fn(),
  on: (event: string, cb: (lng: string) => void) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(cb);
  },
  off: (event: string, cb: (lng: string) => void) => {
    listeners[event] = (listeners[event] || []).filter((fn) => fn !== cb);
  },
} as const;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: fakeI18n }),
}));

// Router hooks and auth/query mocks.
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

// Silence API_BASE usage in logout form (not executed in our demo logout path).
vi.mock('@/api/httpClient', () => ({ API_BASE: '/api' }));

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    lastHeaderProps = undefined;
    lastSidebarProps = undefined;
  });

  it('renders header, sidebar, and main sections', () => {
    render(<AppShell />);

    expect(screen.getByTestId('app-header')).toBeInTheDocument();
    expect(screen.getByTestId('app-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('app-main')).toHaveTextContent('main');
  });

  it('passes help topic and state handlers to header and sidebar', () => {
    render(<AppShell />);

    expect(lastHeaderProps?.helpTopic).toBe('test-topic');
    expect(typeof lastHeaderProps?.onDrawerToggle).toBe('function');
    expect(lastSidebarProps?.mobileOpen).toBe(false);
  });

  it('toggles mobile drawer when header drawer toggle is invoked', () => {
    render(<AppShell />);

    act(() => {
      (lastHeaderProps?.onDrawerToggle as () => void)();
    });

    expect(lastSidebarProps?.mobileOpen).toBe(true);
  });

  it('handles demo logout by clearing query cache and navigating to success page', () => {
    render(<AppShell />);

    act(() => {
      (lastHeaderProps?.onLogout as () => void)();
    });

    expect(mockQueryClient.clear).toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/logout-success', { replace: true });
  });

  it('changes locale and shows toast message', () => {
    render(<AppShell />);

    act(() => {
      (lastHeaderProps?.onLocaleChange as (l: 'en' | 'de') => void)('en');
    });

    expect(fakeI18n.changeLanguage).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
    expect(screen.getByText('Language: English')).toBeInTheDocument();
  });

  it('toggles theme mode and persists preference', () => {
    render(<AppShell />);

    act(() => {
      (lastHeaderProps?.onThemeModeChange as (m: 'light' | 'dark') => void)('dark');
    });

    expect(localStorage.getItem('themeMode')).toBe('dark');
    expect(screen.getByText('Dark mode enabled')).toBeInTheDocument();
  });
});