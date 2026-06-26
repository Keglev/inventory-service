/**
 * @file HelpContext.tsx
 * @module context/help/HelpContext
 *
 * @summary
 * HelpProvider component owning help drawer state (current topic
 * id + open/close) for the help system.
 *
 * @enterprise
 * - Mounted ONCE at the app composition root (App.tsx — same level
 *   as HelpPanel, which subscribes via useHelp()).
 * - The .tsx/.types.ts split is required by Vite's fast refresh:
 *   files exporting React components must not also export non-
 *   component values. The Context OBJECT lives in HelpContext.types.ts
 *   so HelpProvider edits trigger HMR cleanly.
 * - closeHelp() defers clearing currentTopicId by 300ms to let the
 *   drawer fade out before the topic content unmounts (prevents a
 *   blank flash mid-animation). The 300ms is NOT tied to any MUI
 *   Drawer constant — see CB-APP27.
 * - State is intentionally simple (id + boolean). Topic content
 *   resolution lives in HelpPanel (via getHelpTopic and i18n) —
 *   this provider holds NO topic content, only navigation state.
 */
import * as React from 'react';
import { HelpContext, type HelpContextType } from './HelpContext.types';

// Re-export types for backward compatibility
export type { HelpContextType } from './HelpContext.types';
export { HelpContext } from './HelpContext.types';

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTopicId, setCurrentTopicId] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const openHelp = React.useCallback((topicId: string) => {
    setCurrentTopicId(topicId);
    setIsOpen(true);
  }, []);

  const closeHelp = React.useCallback(() => {
    setIsOpen(false);
    // WHY: keep topic id mounted while the Drawer fades out so the body text does not blank mid-animation
    // BUCKET: 300ms is not tied to any MUI Drawer transitionDuration constant (MUI defaults ~195-225ms); align via shared constant or document why 300 is safe (CB-APP27)
    setTimeout(() => {
      setCurrentTopicId(null);
    }, 300);
  }, []);

  // BUCKET: redundant with MUI Drawer's built-in Escape→onClose (=closeHelp) — fires closeHelp twice per Escape press; idempotent today but contradicts HelpPanel @enterprise documentation (CB-APP28)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeHelp();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, closeHelp]);

  const value: HelpContextType = {
    currentTopicId,
    isOpen,
    openHelp,
    closeHelp,
  };

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
};

export default HelpProvider;
