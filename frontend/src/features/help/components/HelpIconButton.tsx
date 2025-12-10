/**
 * HelpIconButton.tsx
 * 
 * A reusable help icon button component that opens context-specific help topics.
 * 
 * @module features/help/components/HelpIconButton
 * @summary
 * Provides a standardized help icon button for opening help topics.
 * Integrates with the useHelp hook for topic management.
 * @enterprise
 * - Consistent help icon UI across the application
 * - Easy integration with help system via topic IDs
 * - Tooltip support for better UX
 * - Fully typed with TypeScript and documented with TypeDoc
 * @usage
 * ```tsx
 * import { HelpIconButton } from '@/features/help/components/HelpIconButton';
 * 
 * function MyComponent() {
 *  return (
 *   <div>
 *    <HelpIconButton topicId="app.main" tooltip="Get help on the main app" />
 *  </div>
 * );
 * }
 * ```
 */
import * as React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useHelp } from '../../../hooks/useHelp';

/** Props for HelpIconButton component */
interface HelpIconButtonProps {
  /** ID from HELP_TOPICS (e.g. "app.main", "analytics.overview") */
  topicId: string;
  tooltip?: string;
}

/** Help icon button that opens a help topic when clicked */
export const HelpIconButton: React.FC<HelpIconButtonProps> = ({ topicId, tooltip }) => {
  const { openHelp } = useHelp();

  return (
    <Tooltip title={tooltip ?? 'Help'}>
      {/* Help icon button */}
      <IconButton
        size="small"
        onClick={() => openHelp(topicId)}
        aria-label="Open help"
      >
        <HelpOutlineIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default HelpIconButton;
