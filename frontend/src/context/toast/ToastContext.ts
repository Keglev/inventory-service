/**
 * @file ToastContext.ts
 * @module context/toast/ToastContext
 *
 * @summary
 * Context object + useToast hook for ephemeral notifications,
 * shared between authenticated and unauthenticated shells.
 *
 * @enterprise
 * - Consumed by BOTH shells: AppShell.tsx (authenticated) and
 *   AppPublicShell.tsx (unauthenticated), each providing its own
 *   implementation via ToastContext.Provider value. The context
 *   here defines only the SHAPE — no implementation.
 * - Default value is a no-op function (NOT undefined). Intentional:
 *   tolerates render outside a provider without throwing — useful
 *   for tests and isolated component renders. Trade-off: a missing
 *   provider in production silently swallows toast calls.
 * - Severity union ('success' | 'info' | 'warning' | 'error')
 *   matches MUI Alert's severity prop for visual consistency
 *   without importing MUI Alert types here (kept dependency-light).
 */

import * as React from 'react';

/** Toast function type: message + optional severity level */
export type ToastFn = (msg: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;

/** Global toast context (no-op default). */
export const ToastContext = React.createContext<ToastFn>(() => {});

/**
 * Access the toast function provided by AppShell or AppPublicShell.
 *
 * @returns Toast function to display notifications with optional severity
 */
export const useToast = (): ToastFn => {
  // WHY: the context default is a no-op toast, so consumers outside a provider degrade silently by design — no throw.
  return React.useContext(ToastContext);
};
