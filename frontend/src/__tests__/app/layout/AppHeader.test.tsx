import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AppHeader from '@/app/layout/AppHeader';

// Mock i18n translation to return the key for easy assertions.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Capture props passed to the toolbar actions for verification.
let lastToolbarProps: Partial<{
  themeMode: 'light' | 'dark';
  locale: 'de' | 'en';
  helpTopic: string;
  onThemeModeChange: (mode: 'light' | 'dark') => void;
  onLocaleChange: (locale: 'de' | 'en') => void;
  onLogout: () => void;
}> | undefined;
vi.mock('@/app/layout/AppToolbarActions', () => ({
  default: (props: typeof lastToolbarProps) => {
    lastToolbarProps = props;
    return <div data-testid="toolbar-actions" />;
  },
}));

// Simple stubs for badges to assert presence.
vi.mock('@/app/layout/header', () => ({
  HealthBadge: () => <div data-testid="health-badge" />,
  HeaderDemoBadge: ({ isDemo }: { isDemo: boolean }) => (
    <div data-testid="demo-badge">demo:{String(isDemo)}</div>
  ),
}));

describe('AppHeader', () => {
  const baseProps = {
    themeMode: 'light' as const,
    onThemeModeChange: vi.fn(),
    locale: 'de' as const,
    onLocaleChange: vi.fn(),
    onLogout: vi.fn(),
    helpTopic: 'dashboard',
    isDemo: true,
    onDrawerToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    lastToolbarProps = undefined;
  });

  it('renders title, badges, and toolbar actions', () => {
    render(<AppHeader {...baseProps} />);

    expect(screen.getByText('app.title')).toBeInTheDocument();
    expect(screen.getByTestId('health-badge')).toBeInTheDocument();
    expect(screen.getByTestId('demo-badge')).toHaveTextContent('demo:true');
    expect(screen.getByTestId('toolbar-actions')).toBeInTheDocument();
  });

  it('delegates props to AppToolbarActions', () => {
    render(<AppHeader {...baseProps} />);

    expect(lastToolbarProps).toMatchObject({
      themeMode: 'light',
      locale: 'de',
      helpTopic: 'dashboard',
    });
  });

  it('invokes drawer toggle when menu button is clicked', () => {
    render(<AppHeader {...baseProps} />);

    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    expect(baseProps.onDrawerToggle).toHaveBeenCalledTimes(1);
  });
});