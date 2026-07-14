/**
 * @file useShellLogout.test.ts
 * @module __tests__/app/layout/useShellLogout
 * @description Logout handler factory for the authenticated shell.
 *
 * Contract under test:
 * - Demo mode: clears the query cache, logs out locally, and routes
 *   directly to /logout-success (no server round trip).
 * - Server mode: routes to /logout, where the logout page performs the
 *   server-side session termination.
 */
import { describe, it, expect, vi } from 'vitest';

import { useShellLogout } from '../../../app/layout/useShellLogout';

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

  it('submits a POST logout form to the backend outside demo mode', () => {
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, 'submit')
      .mockImplementation(() => {});
    const deps = makeDeps(false);
    const handleLogout = useShellLogout(deps as unknown as Parameters<typeof useShellLogout>[0]);

    handleLogout();

    const form = document.querySelector('form') as HTMLFormElement;
    expect(form).not.toBeNull();
    expect(form.method.toUpperCase()).toBe('POST');
    expect(form.action).toContain('/logout?return=');
    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(deps.navigate).not.toHaveBeenCalled();
    expect(deps.queryClient.clear).not.toHaveBeenCalled();

    form.remove();
    submitSpy.mockRestore();
  });
});
