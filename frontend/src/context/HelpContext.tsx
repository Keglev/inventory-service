/**
 * @file HelpContext.tsx
 * @description
 * Global help context provider for managing help panel state and topic navigation.
 * Provides centralized state for opening/closing help and tracking current topic.
 *
 * @enterprise
 * - Single source of truth for help state
 * - Close on Escape key for better UX
 * - Type-safe context with clear API
 *
 * @usage
 * Wrap App with <HelpProvider>
 * Access anywhere with: const { openHelp, closeHelp, isOpen } = useHelp()
 */
import * as React from 'react';
import { HelpContext, type HelpContextType } from './HelpContext.types';

// Re-export types for backward compatibility
export type { HelpContextType } from './HelpContext.types';
export { HelpContext } from './HelpContext.types';

/**
 * HelpProvider: Wrap around App root
 * Manages help panel state and provides context to all components
 */
export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTopicId, setCurrentTopicId] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  /**
   * Open help with specific topic
   */
  const openHelp = React.useCallback((topicId: string) => {
    setCurrentTopicId(topicId);
    setIsOpen(true);
  }, []);

  /**
   * Close help panel
   */
  const closeHelp = React.useCallback(() => {
    setIsOpen(false);
    // Keep topic ID so it can fade out smoothly, clear after animation
    setTimeout(() => {
      setCurrentTopicId(null);
    }, 300);
  }, []);

  /**
   * Close help on Escape key press
   */
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
