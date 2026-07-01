/**
 * @file useRefreshHandler.test.ts
 * @module __tests__/components/pages/inventory/useRefreshHandler
 * @description Contract tests for `useRefreshHandler`:
 * - `handleReload` invokes the injected reload function.
 *
 * Out of scope:
 * - The reload implementation itself (owned by useInventoryPageData).
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRefreshHandler } from '../../../../pages/inventory/handlers/useRefreshHandler';

describe('useRefreshHandler', () => {
  it('returns handleReload', () => {
    const reload = vi.fn();
    const { result } = renderHook(() => useRefreshHandler(reload));

    expect(result.current.handleReload).toBeTypeOf('function');
  });

  it('invokes the injected reload when handleReload is called', () => {
    const reload = vi.fn();
    const { result } = renderHook(() => useRefreshHandler(reload));

    result.current.handleReload();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
