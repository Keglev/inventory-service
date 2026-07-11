/**
 * @file useShellLogout.ts
 * @module app/layout/useShellLogout
 *
 * @summary
 * Builds the shell's logout handler: demo users get a client-side redirect to
 * the logout-success route; real users are logged out via a POST form redirect
 * to the backend (avoiding SPA-guard flicker). Extracted from AppShell.
 */

import type { useNavigate } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { API_BASE } from '../../api/httpClient';

interface ShellLogoutDeps {
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
    // Demo mode: clear client state and route directly to logout-success
    if (isDemo) {
      queryClient.clear();
      logout();
      navigate('/logout-success', { replace: true });
      return;
    }

    // Real user: trigger backend logout via POST redirect, avoid SPA guard flicker
    const form = document.createElement('form');
    form.method = 'POST';
    const returnUrl = `${window.location.origin}/logout-success`;
    form.action = `${API_BASE}/logout?return=${encodeURIComponent(returnUrl)}`;
    form.style.display = 'none';
    document.body.appendChild(form);
    form.submit();
  };
}
