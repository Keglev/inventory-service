/**
 * @file features/help/components/HelpIconButton.tsx
 * @module features/help/components/HelpIconButton
 * @summary Standardized icon button that opens a help topic on click —
 * the canonical surface for exposing context-sensitive help.
 * @enterprise
 * - Six production call sites split across layout chrome (sidebar,
 *   toolbar) and page content (analytics, dashboard, inventory
 *   board, one inventory dialog). The standard surface for
 *   exposing help topics — callers pass a topic id string from
 *   help/topics.ts.
 * - Click delegates to openHelp() on the canonical useHelp hook
 *   (hooks/useHelp.ts). HelpPanel.tsx (mounted in App.tsx)
 *   resolves the topic and renders the drawer.
 * - Topic id validation is downstream: an unknown id returns null
 *   at HelpPanel and the drawer silently renders nothing. Callers
 *   are responsible for passing registry-valid ids.
 * - Default tooltip + aria-label are hardcoded English — see
 *   CM-APP8 for the i18n threading fix.
 */
import * as React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useHelp } from '../../../hooks/useHelp';

interface HelpIconButtonProps {
  /** ID from HELP_TOPICS (e.g. "app.main", "analytics.overview") */
  topicId: string;
  tooltip?: string;
}

export const HelpIconButton: React.FC<HelpIconButtonProps> = ({ topicId, tooltip }) => {
  const { openHelp } = useHelp();

  // BUCKET: hardcoded English defaults — tooltip 'Help' and aria-label 'Open help' visible to DE users when callers omit translated props; thread useTranslation and add common namespace keys (CM-APP8)
  return (
    <Tooltip title={tooltip ?? 'Help'}>
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
