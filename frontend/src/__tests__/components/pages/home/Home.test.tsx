import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../../../pages/home/Home';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ 
    t: (key: string, defaultVal?: string) => defaultVal || key 
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
  };

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      loginAsDemo: vi.fn(),
    });
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects to dashboard when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com' },
      loading: false,
      loginAsDemo: vi.fn(),
    });
    renderComponent();
    // When authenticated, component shows nothing (just redirects via Navigate)
    expect(screen.queryByText('SmartSupplyPro')).not.toBeInTheDocument();
  });

  it('renders landing card when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      loginAsDemo: vi.fn(),
    });
    renderComponent();
    expect(screen.getByText('SmartSupplyPro')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      loginAsDemo: vi.fn(),
    });
    renderComponent();
    expect(screen.getByText('signIn')).toBeInTheDocument();
  });

  it('renders demo mode button', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      loginAsDemo: vi.fn(),
    });
    renderComponent();
    expect(screen.getByText('Continue in Demo Mode')).toBeInTheDocument();
  });

  it('navigates to login when sign in button is clicked', async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      loginAsDemo: vi.fn(),
    });
    renderComponent();
    const signInButton = screen.getByText('signIn');
    await user.click(signInButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('calls loginAsDemo and navigates to dashboard when demo button is clicked', async () => {
    const user = userEvent.setup();
    const loginAsDemo = vi.fn();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      loginAsDemo,
    });
    renderComponent();
    const demoButton = screen.getByText('Continue in Demo Mode');
    await user.click(demoButton);
    expect(loginAsDemo).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('renders SSO hint text', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      loginAsDemo: vi.fn(),
    });
    renderComponent();
    expect(screen.getByText('ssoHint')).toBeInTheDocument();
  });

  it('renders welcome message', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      loginAsDemo: vi.fn(),
    });
    renderComponent();
    expect(screen.getByText('welcome')).toBeInTheDocument();
  });
});
