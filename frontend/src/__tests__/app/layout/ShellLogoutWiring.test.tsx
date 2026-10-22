/**
 * @file ShellLogoutWiring.test.tsx
 * @module __tests__/app/layout/ShellLogoutWiring
 * @testing Wiring: the shell's menu logout (useShellLogout) through the real
 *   router, AuthProvider and LogoutPage.
 * @description A signed-in (non-demo) user who logs out from the avatar menu
 *   must reach the same cleanup as every other logout: the cross-tab signal
 *   (FORCE_LOGOUT_FLAG) and the backend form POST. Siblings:
 *   useShellLogout.test.ts (handler), LogoutPage.test.tsx (form contents).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

const httpClientMock = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('@/api/httpClient', () => ({
  default: httpClientMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import AuthProvider from '@/context/auth/AuthProvider';
import LogoutPage from '@/pages/auth/LogoutPage';
import { useShellLogout } from '@/app/layout/useShellLogout';
import { useAuth } from '@/hooks/useAuth';
import { FORCE_LOGOUT_FLAG } from '@/config/storageKeys';
import { createTestQueryClient } from '@/__tests__/test/queryClient';

/** Stands in for AppShell: the same handler wiring, one button. */
function ShellStandIn() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const handleLogout = useShellLogout({ isDemo: Boolean(user?.isDemo), logout, queryClient, navigate });
  return user ? <button type="button" onClick={handleLogout}>menu logout</button> : null;
}

function renderSignedIn() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<ShellStandIn />} />
            <Route path="/logout" element={<LogoutPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('ShellLogoutWiring', () => {
  beforeEach(() => {
    localStorage.clear();
    httpClientMock.get.mockResolvedValue({
      data: { email: 'admin@example.com', fullName: 'Admin User', role: 'ADMIN' },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll('form').forEach((form) => form.remove());
    localStorage.clear();
  });

  it('tells the other tabs and posts the logout form when a signed-in user logs out from the menu', async () => {
    const submitSpy = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const user = userEvent.setup();
    renderSignedIn();

    await user.click(await screen.findByRole('button', { name: 'menu logout' }));

    await waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));
    expect(setItemSpy).toHaveBeenCalledWith(FORCE_LOGOUT_FLAG, '1');
    expect(screen.getByText('logoutSigningOut')).toBeInTheDocument();
  });
});
