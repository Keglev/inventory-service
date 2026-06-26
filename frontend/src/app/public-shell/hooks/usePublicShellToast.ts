/**
 * @file usePublicShellToast.ts
 * @module usePublicShellToast
 * @summary Toast state owner for the public shell; canonical home of the Toast
 * type, re-exported through both hooks/index and the root public-shell barrel.
 *
 * @enterprise
 * - Toast state is isolated here (not in AppPublicShell) so the hook can be tested
 *   independently of the shell layout.
 *
 * @example
 * ```tsx
 * const { toast, showToast, hideToast } = usePublicShellToast();
 * ```
 */
import * as React from 'react';

export interface Toast {
  open: boolean;
  msg: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface UsePublicShellToastReturn {
  toast: Toast | null;
  showToast: (msg: string, severity?: 'success' | 'info' | 'warning' | 'error') => void;
  hideToast: () => void;
  setToast: (toast: Toast | null) => void;
}

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
