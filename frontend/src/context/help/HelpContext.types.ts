/**
 * @file HelpContext.types.ts
 * @module context/help/HelpContext.types
 *
 * @summary
 * Type definitions and the HelpContext object — split from the
 * Provider component to comply with Vite fast refresh constraints.
 *
 * @enterprise
 * - File exists solely to host non-component exports (the
 *   HelpContextType interface and the HelpContext object) so the
 *   sibling HelpContext.tsx can export only component values and
 *   preserve Vite's fast-refresh HMR.
 * - HelpContext defaults to `undefined`. The `useHelp` hook
 *   (frontend/src/hooks/useHelp.ts, built via createContextHook)
 *   throws when ctx is undefined, enforcing provider-wrapped usage.
 *   This contrasts with ToastContext's no-op default — intentional:
 *   help misuse should surface loudly, toast misuse should not crash.
 */
import * as React from 'react';

export interface HelpContextType {
  currentTopicId: string | null;
  isOpen: boolean;
  openHelp: (topicId: string) => void;
  closeHelp: () => void;
}

export const HelpContext = React.createContext<HelpContextType | undefined>(undefined);
