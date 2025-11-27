/**
 * @file useHelp.ts
 * @description
 * Custom hook for accessing global help context from anywhere in the component tree.
 * Provides type-safe access to help state and functions.
 *
 * @usage
 * const { openHelp, closeHelp, currentTopicId, isOpen } = useHelp()
 * openHelp('app.main')
 */

import { useContext } from 'react';
import { HelpContext, type HelpContextType } from '../context/HelpContext.types';

/**
 * Access global help context from anywhere in the component tree.
 * Must be used within a component wrapped by HelpProvider.
 *
 * @returns Help context with state and functions
 * @throws Error if used outside HelpProvider
 *
 * @example
 * ```tsx
 * const { openHelp, closeHelp, currentTopicId, isOpen } = useHelp()
 * 
 * return (
 *   <button onClick={() => openHelp('inventory.editItem')}>
 *     Help
 *   </button>
 * )
 * ```
 */
export const useHelp = (): HelpContextType => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};
