/**
 * @file useShellLogout.test.ts
 * @module __tests__/app/layout/useShellLogout
 * @description Logout handler factory for the authenticated shell.
 *
 * Contract under test:
 * - Demo mode: clears the query cache, logs out locally, and routes
 *   directly to /logout-success (no server round trip).
 * - Server mode: submits a hidden POST form to <API origin>/logout with the
 *   logout-success return URL; the development root '/' stays same-origin.
 */
import { afterEach, describe, it, expect, vi } from 'vitest';

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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

  it('posts to the same-origin /logout when the env value is the development root', () => {
    // '/' once produced '//logout', a protocol-relative URL to a host named "logout".
    vi.stubEnv('VITE_API_BASE', '/');
    const submitSpy = vi
      .spyOn(HTMLFormElement.prototype, 'submit')
      .mockImplementation(() => {});
    const handleLogout = useShellLogout(makeDeps(false) as unknown as Parameters<typeof useShellLogout>[0]);

    handleLogout();

    const form = document.querySelector('form') as HTMLFormElement;
    const encodedReturn = encodeURIComponent(`${window.location.origin}/logout-success`);
    expect(form.action).toBe(`${window.location.origin}/logout?return=${encodedReturn}`);

    form.remove();
    submitSpy.mockRestore();
  });
});
