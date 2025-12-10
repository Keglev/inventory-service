/**
 * @file ToastContext.ts
 * @description
 * Ultra-light toast context: exposes a single function for ephemeral messages.
 * Kept separate to satisfy react-refresh and to allow reuse across shells (AppShell, AppPublicShell).
 *
 * @enterprise
 * - Provides a simple callback interface for toast notifications
 * - Used by both authenticated (AppShell) and unauthenticated (AppPublicShell) shells
 * - Consumed by page components and dialogs via useToast() hook
 * - No-op default context to prevent errors if used outside provider
 *
 * @example
 * ```tsx
 * // In a shell:
 * <ToastContext.Provider value={(msg, severity) => showToast(msg, severity)}>
 *   {children}
 * </ToastContext.Provider>
 *
 * // In a component:
 * const toast = useToast();
 * toast('Operation successful', 'success');
 * ```
 */

import * as React from 'react';

/**
 * Toast function type: message + optional severity level
 */
export type ToastFn = (msg: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;

/**
 * Global toast context (no-op default).
 * Provides a simple callback to display transient notifications.
 */
export const ToastContext = React.createContext<ToastFn>(() => {});

/**
 * Access the toast function provided by AppShell or AppPublicShell.
 * @throws Error if used outside of a matching provider
 *
 * @example
 * ```tsx
 * const toast = useToast();
 * toast('Success!', 'success');
 * ```
 *
 * @returns Toast function to display notifications
 */
export const useToast = (): ToastFn => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastContext.Provider');
  }
  return ctx;
};
