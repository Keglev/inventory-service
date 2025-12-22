import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import LogoutPage from '../../../../pages/auth/LogoutPage';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockLogout = vi.fn();
const mockUseAuth = vi.hoisted(() => vi.fn());
vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

// Mock the API_BASE constant
vi.mock('../../../../api/httpClient', () => ({
  API_BASE: 'http://localhost:8080',
}));

describe('LogoutPage', () => {
  let queryClient: QueryClient;
  let originalAppendChild: typeof document.body.appendChild;
  let originalRemoveChild: typeof document.body.removeChild;
  let capturedForm: HTMLFormElement | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    mockUseAuth.mockReturnValue({
      logout: mockLogout,
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      setUser: vi.fn(),
      user: null,
      loading: false,
      logoutInProgress: false,
    });

    // Mock DOM methods to prevent actual form submission
    originalAppendChild = document.body.appendChild;
    originalRemoveChild = document.body.removeChild;

    document.body.appendChild = vi.fn((node: Node) => {
      if (node instanceof HTMLFormElement) {
        capturedForm = node;
      }
      return node;
    }) as typeof document.body.appendChild;

    document.body.removeChild = vi.fn();

    // Mock form submit to prevent actual submission
    HTMLFormElement.prototype.submit = vi.fn();
  });

  afterEach(() => {
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    capturedForm = null;
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LogoutPage />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  it('calls logout from auth context', () => {
    renderComponent();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('clears React Query cache', () => {
    const clearSpy = vi.spyOn(queryClient, 'clear');
    renderComponent();
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('creates and submits form with correct action', async () => {
    renderComponent();

    await waitFor(() => {
      expect(capturedForm).not.toBeNull();
    });

    expect(capturedForm?.method).toBe('post');
    expect(capturedForm?.action).toContain('/logout?return=');
    expect(capturedForm?.action).toContain('logout-success');
  });

  it('form has POST method', async () => {
    renderComponent();

    await waitFor(() => {
      expect(capturedForm).not.toBeNull();
    });

    expect(capturedForm?.method).toBe('post');
  });

  it('form action includes return URL', async () => {
    renderComponent();

    await waitFor(() => {
      expect(capturedForm).not.toBeNull();
    });

    const returnUrl = encodeURIComponent(`${window.location.origin}/logout-success`);
    expect(capturedForm?.action).toContain(`return=${returnUrl}`);
  });

  it('form is hidden', async () => {
    renderComponent();

    await waitFor(() => {
      expect(capturedForm).not.toBeNull();
    });

    expect(capturedForm?.style.display).toBe('none');
  });

  it('form is appended to document body', () => {
    renderComponent();
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it('submits form automatically', async () => {
    renderComponent();

    await waitFor(() => {
      expect(capturedForm).not.toBeNull();
    });

    expect(capturedForm?.submit).toHaveBeenCalledTimes(1);
  });

  it('attempts to remove form on cleanup', () => {
    const { unmount } = renderComponent();
    unmount();
    expect(document.body.removeChild).toHaveBeenCalled();
  });

  it('handles cleanup error gracefully', () => {
    document.body.removeChild = vi.fn(() => {
      throw new Error('Node not found');
    });

    const { unmount } = renderComponent();
    expect(() => unmount()).not.toThrow();
  });

  it('uses correct API base URL', async () => {
    renderComponent();

    await waitFor(() => {
      expect(capturedForm).not.toBeNull();
    });

    expect(capturedForm?.action).toContain('http://localhost:8080/logout');
  });
});
