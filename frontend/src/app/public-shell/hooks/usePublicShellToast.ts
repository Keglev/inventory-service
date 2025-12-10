/**
 * @file usePublicShellToast.ts
 * @description
 * Custom hook for managing toast notification state in public shell.
 * Provides show/hide interface with severity levels.
 *
 * @enterprise
 * - Manages toast state with message and severity
 * - Provides open/close and setToast interface
 * - Integrates with MUI Alert severity types
 *
 * @example
 * ```tsx
 * const { toast, showToast, hideToast } = usePublicShellToast();
 * ```
 *
 * @returns Toast state and control functions
 */
import * as React from 'react';

export interface Toast {
  /** Toast is currently visible */
  open: boolean;
  /** Toast message text */
  msg: string;
  /** Severity level for Alert component */
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface UsePublicShellToastReturn {
  /** Current toast state */
  toast: Toast | null;
  /** Show toast with message and severity */
  showToast: (msg: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
  /** Hide toast */
  hideToast: () => void;
  /** Set complete toast state */
  setToast: (toast: Toast | null) => void;
}

/**
 * usePublicShellToast hook
 * @returns Toast state and control functions
 */
export const usePublicShellToast = (): UsePublicShellToastReturn => {
  const [toast, setToast] = React.useState<Toast | null>(null);

  const showToast = (msg: string, severity: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ open: true, msg, severity });
  };

  const hideToast = () => {
    setToast((prev) => (prev ? { ...prev, open: false } : null));
  };

  return { toast, showToast, hideToast, setToast };
};
