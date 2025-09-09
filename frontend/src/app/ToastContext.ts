/**
 * @file ToastContext.ts
 * @description
 * Ultra-light toast context: exposes a single function for ephemeral messages.
 * Kept separate to satisfy react-refresh and to allow reuse outside AppShell.
 */

import * as React from 'react';

export type ToastFn = (msg: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;

/** Global toast context (no-op default). */
export const ToastContext = React.createContext<ToastFn>(() => {});

/**
 * Access the toast function provided by AppShell or a higher-level provider.
 * @throws Error if used outside of a matching provider.
 */
export const useToast = (): ToastFn => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastContext.Provider');
  }
  return ctx;
};
