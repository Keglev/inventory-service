/**
 * @file useShellLogout.test.ts
 * @module __tests__/app/layout/useShellLogout
 * @description Logout handler factory for the authenticated shell.
 *
 * Contract under test:
 * - Demo mode: clears the query cache, logs out locally, and routes
 *   directly to /logout-success (no server round trip).
 * - Server mode: routes to /logout and leaves the cleanup to LogoutPage (the
 *   form POST is covered in LogoutPage.test.tsx, the cross-tab signal in
 *   ShellLogoutWiring.test.tsx).
 */
import { describe, it, expect, vi } from 'vitest';

import { useShellLogout } from '@/app/layout/useShellLogout';

function makeDeps(isDemo: boolean) {
  return {
    isDemo,
    queryClient: { clear: vi.fn() },
    logout: vi.fn(),
    navigate: vi.fn(),
  };
}

describe('useShellLogout', () => {
  it('clears client state and routes to logout-success in demo mode', () => {
    const deps = makeDeps(true);
    const handleLogout = useShellLogout(deps as unknown as Parameters<typeof useShellLogout>[0]);

    handleLogout();

    expect(deps.queryClient.clear).toHaveBeenCalledTimes(1);
    expect(deps.logout).toHaveBeenCalledTimes(1);
    expect(deps.navigate).toHaveBeenCalledWith('/logout-success', { replace: true });
  });

  it('routes to /logout outside demo mode and posts no form itself', () => {
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, 'submit')
      .mockImplementation(() => {});
    const deps = makeDeps(false);
    const handleLogout = useShellLogout(deps as unknown as Parameters<typeof useShellLogout>[0]);

    handleLogout();

    expect(deps.navigate).toHaveBeenCalledWith('/logout', { replace: true });
    expect(submitSpy).not.toHaveBeenCalled();
    // LogoutPage owns the cleanup; doing it here first would clear the user
    // while the shell's guards are still mounted.
    expect(deps.queryClient.clear).not.toHaveBeenCalled();
    expect(deps.logout).not.toHaveBeenCalled();

    submitSpy.mockRestore();
  });
});
