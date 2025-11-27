/**
 * @file HelpContext.types.ts
 * @description
 * Type definitions and context object for the help system.
 * Separated into its own file to comply with Vite's fast refresh requirements.
 */
import * as React from 'react';

/**
 * Help context type definition
 */
export interface HelpContextType {
  currentTopicId: string | null;
  isOpen: boolean;
  openHelp: (topicId: string) => void;
  closeHelp: () => void;
}

/**
 * Create help context with undefined default
 */
export const HelpContext = React.createContext<HelpContextType | undefined>(undefined);
