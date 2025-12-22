import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthCallback from '../../../../pages/auth/AuthCallback';
import httpClient from '../../../../api/httpClient';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
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

const mockSetUser = vi.fn();
const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../../../../api/httpClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      setUser: mockSetUser,
      user: null,
      loading: false,
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      logout: vi.fn(),
      logoutInProgress: false,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AuthCallback />
      </MemoryRouter>
    );
  };

  it('renders loading state', () => {
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Verifying your login…')).toBeInTheDocument();
  });

  it('calls /api/me on mount', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({
      data: { email: 'test@example.com', fullName: 'Test User', role: 'USER' },
    });

    renderComponent();

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalledWith('/api/me');
    });
  });

  it('sets user and navigates to dashboard on successful verification', async () => {
    const userData = {
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
    };

    vi.mocked(httpClient.get).mockResolvedValue({ data: userData });

    renderComponent();

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('navigates to login with error on verification failure', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('Unauthorized'));

    renderComponent();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=session', { replace: true });
    });
  });

  it('does not call setUser if component unmounts before response', async () => {
    let resolvePromise: (value: { data: unknown }) => void;
    const promise = new Promise<{ data: unknown }>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(httpClient.get).mockReturnValue(promise as never);

    const { unmount } = renderComponent();

    // Unmount before the promise resolves
    unmount();

    // Now resolve the promise
    resolvePromise!({
      data: { email: 'test@example.com', fullName: 'Test User', role: 'USER' },
    });

    await waitFor(() => {
      expect(httpClient.get).toHaveBeenCalled();
    });

    // setUser should not be called after unmount
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it('handles network errors gracefully', async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?error=session', { replace: true });
    });

    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it('displays centered loading UI', () => {
    renderComponent();
    
    const loadingBox = screen.getByRole('progressbar').closest('div');
    expect(loadingBox).toBeInTheDocument();
  });
});
