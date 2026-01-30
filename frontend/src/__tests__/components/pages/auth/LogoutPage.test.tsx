/**
 * @file LogoutPage.test.tsx
 * @module __tests__/components/pages/auth/LogoutPage
 * @description Enterprise integration tests for the LogoutPage (non-XHR logout flow).
 *
 * Contract under test (see LogoutPage.tsx):
 * - On mount, clears React Query cache and clears AuthContext via useAuth().logout().
 * - Performs a top-level POST navigation by creating a hidden <form> and submitting it to:
 *     `${API_BASE}/logout?return=<origin>/logout-success` (URL-encoded).
 * - Appends the form to document.body before submission.
 * - On unmount, attempts to remove the form and must not throw if removal fails.
 *
 * Test strategy:
 * - Wraps the page with a QueryClientProvider configured with retry:false (deterministic).
 * - Mocks useAuth().logout and the API_BASE constant.
 * - Captures the generated form by intercepting document.body.appendChild.
 * - Stubs HTMLFormElement.prototype.submit to prevent actual navigation in jsdom.
 *
 * Notes:
 * - We avoid asserting MUI classes/layout; we only assert behavior and user-visible contracts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import LogoutPage from '../../../../pages/auth/LogoutPage';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mockLogout = vi.hoisted(() => vi.fn());
const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Keep assertions stable: return the translation key.
    t: (key: string) => key,
  }),
}));

vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('../../../../api/httpClient', () => ({
  API_BASE: 'http://localhost:8080',
}));

// -------------------------------------
// Suite utilities
// -------------------------------------
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

describe('LogoutPage', () => {
  let queryClient: QueryClient;

  // We intercept DOM operations to capture and inspect the submitted <form>.
  let capturedForm: HTMLFormElement | null = null;
  let originalAppendChild: typeof document.body.appendChild;
  let originalRemoveChild: typeof document.body.removeChild;

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = createTestQueryClient();

    mockUseAuth.mockReturnValue({
      logout: mockLogout,
      login: vi.fn(),
      loginAsDemo: vi.fn(),
      setUser: vi.fn(),
      user: null,
      loading: false,
      logoutInProgress: false,
    });

    // Capture the generated form without performing real DOM navigation.
    capturedForm = null;
    originalAppendChild = document.body.appendChild;
    originalRemoveChild = document.body.removeChild;

    document.body.appendChild = vi.fn((node: Node) => {
      if (node instanceof HTMLFormElement) capturedForm = node;
      return originalAppendChild.call(document.body, node);
    }) as typeof document.body.appendChild;

    document.body.removeChild = vi.fn() as typeof document.body.removeChild;

    // Prevent jsdom from attempting a real form submission/navigation.
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);
  });

  afterEach(() => {
    // Restore DOM methods to avoid leaking state across files.
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
    capturedForm = null;

    vi.restoreAllMocks();
  });

  function renderLogoutPage() {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <LogoutPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it('renders a progress UI while logout navigation occurs', () => {
    renderLogoutPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('logoutSigningOut')).toBeInTheDocument();
  });

  it('clears client state and posts a hidden logout form to the backend (with return URL)', async () => {
    const clearSpy = vi.spyOn(queryClient, 'clear');

    renderLogoutPage();

    // 1) Client-side cleanup happens immediately on mount.
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(mockLogout).toHaveBeenCalledTimes(1);

    // 2) Form is created and appended to the DOM.
    await waitFor(() => {
      expect(capturedForm).not.toBeNull();
    });

    const form = capturedForm!;
    expect(document.body.appendChild).toHaveBeenCalledWith(form);

    // 3) Form contract: POST, hidden, correct action with encoded return URL.
    expect(form.method.toLowerCase()).toBe('post');
    expect(form.style.display).toBe('none');

    const returnUrl = `${window.location.origin}/logout-success`;
    const encodedReturn = encodeURIComponent(returnUrl);

    expect(form.action).toBe(`http://localhost:8080/logout?return=${encodedReturn}`);

    // 4) Form is submitted.
    expect(form.submit).toHaveBeenCalledTimes(1);
  });

  it('removes the generated form on unmount and does not throw if removal fails', async () => {
    const { unmount } = renderLogoutPage();

    await waitFor(() => {
      expect(capturedForm).not.toBeNull();
    });

    // Normal cleanup: removeChild called with the created form.
    unmount();
    expect(document.body.removeChild).toHaveBeenCalledWith(capturedForm);

    // Defensive cleanup: removal error must be swallowed (component contract: catch/noop).
    document.body.removeChild = vi.fn(() => {
      throw new Error('Node not found');
    }) as typeof document.body.removeChild;

    const { unmount: unmountWithThrow } = renderLogoutPage();
    await waitFor(() => {
      expect(capturedForm).not.toBeNull();
    });

    expect(() => unmountWithThrow()).not.toThrow();
  });
});
