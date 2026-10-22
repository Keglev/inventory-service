/**
 * @file useShellLogout.ts
 * @module app/layout/useShellLogout
 *
 * @summary
 * Builds the shell's logout handler: demo users get a client-side redirect to
 * the logout-success route; real users are routed to /logout, where LogoutPage
 * clears client state, tells the other tabs and posts the backend logout form.
 * Extracted from AppShell.
 *
 * @enterprise
 * - Real users go through LogoutPage like the heartbeat's 401 path, so every
 *   logout clears the query cache and broadcasts to the other tabs. The menu
 *   once posted its own form and skipped both (FO7): other tabs kept showing
 *   cached data until their next request answered 401.
 * - /logout sits outside AppShell and RequireAuth, so clearing the user there
 *   cannot bounce the page to /login before the form posts.
 * - Demo users have no server session: no backend round trip is needed.
 */

import type { useNavigate } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';

export interface ShellLogoutDeps {
  isDemo: boolean;
  logout: () => void;
  queryClient: QueryClient;
  navigate: ReturnType<typeof useNavigate>;
}

export function useShellLogout({
  isDemo,
  logout,
  queryClient,
  navigate,
}: ShellLogoutDeps): () => void {
  return () => {
    if (isDemo) {
      queryClient.clear();
      logout();
      navigate('/logout-success', { replace: true });
      return;
    }

    navigate('/logout', { replace: true });
  };
}
