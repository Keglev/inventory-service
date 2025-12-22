import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from '../../../../pages/auth/LoginPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

const mockLogin = vi.fn();
const mockLoginAsDemo = vi.fn();

const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      loginAsDemo: mockLoginAsDemo,
      logout: vi.fn(),
      setUser: vi.fn(),
      user: null,
      loading: false,
      logoutInProgress: false,
    });
  });

  const renderComponent = (initialRoute = '/login') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders login card with title and subtitle', () => {
    renderComponent();
    expect(screen.getByText('signIn')).toBeInTheDocument();
    expect(screen.getByText('welcome')).toBeInTheDocument();
  });

  it('renders Google SSO button', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /signInGoogle/i })).toBeInTheDocument();
  });

  it('renders demo mode button', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /Continue in Demo Mode/i })).toBeInTheDocument();
  });

  it('renders SSO hint text', () => {
    renderComponent();
    expect(screen.getByText('ssoHint')).toBeInTheDocument();
  });

  it('renders "or" divider between SSO and demo', () => {
    renderComponent();
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('calls login when Google SSO button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const googleButton = screen.getByRole('button', { name: /signInGoogle/i });
    await user.click(googleButton);

    expect(mockLogin).toHaveBeenCalledTimes(1);
  });

  it('calls loginAsDemo when demo button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const demoButton = screen.getByRole('button', { name: /Continue in Demo Mode/i });
    await user.click(demoButton);

    expect(mockLoginAsDemo).toHaveBeenCalledTimes(1);
  });

  it('does not display error alert when no error parameter', () => {
    renderComponent();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('displays error alert when error parameter is present', () => {
    renderComponent('/login?error=oauth');
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText('errorTitle')).toBeInTheDocument();
  });

  it('displays error alert for session error', () => {
    renderComponent('/login?error=session');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('Google button has correct icon', () => {
    renderComponent();
    const googleButton = screen.getByRole('button', { name: /signInGoogle/i });
    expect(googleButton.querySelector('svg')).toBeInTheDocument();
  });

  it('renders card with proper styling constraints', () => {
    renderComponent();
    const card = screen.getByText('signIn').closest('[class*="MuiCard"]');
    expect(card).toBeInTheDocument();
  });

  it('SSO button has outlined variant', () => {
    renderComponent();
    const googleButton = screen.getByRole('button', { name: /signInGoogle/i });
    expect(googleButton).toHaveClass('MuiButton-outlined');
  });

  it('demo button has text variant', () => {
    renderComponent();
    const demoButton = screen.getByRole('button', { name: /Continue in Demo Mode/i });
    expect(demoButton).toHaveClass('MuiButton-text');
  });
});
