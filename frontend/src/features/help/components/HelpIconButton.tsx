/**
 * @file features/help/components/HelpIconButton.tsx
 * @module features/help/components/HelpIconButton
 * @summary Standardized icon button that opens a help topic on click —
 * the canonical surface for exposing context-sensitive help.
 * @enterprise
 * - The standard surface for exposing help topics across layout chrome
 *   (sidebar, toolbar, settings) and page content (analytics, dashboard,
 *   inventory board, and every inventory and supplier dialog). Callers
 *   pass a topic id string from help/topics.ts.
 * - Click delegates to openHelp() on the canonical useHelp hook
 *   (hooks/useHelp.ts). HelpPanel.tsx (mounted in App.tsx)
 *   resolves the topic and renders the drawer.
 * - Topic id validation is downstream: an unknown id returns null
 *   at HelpPanel and the drawer silently renders nothing. Callers
 *   are responsible for passing registry-valid ids.
 * - Tooltip and aria-label default to the translated common:actions.help
 *   label, so screen-reader users get the active locale even when a caller
 *   omits the tooltip prop. Callers may still override the visible tooltip.
 */
import * as React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useTranslation } from 'react-i18next';
import { useHelp } from '../../../hooks/useHelp';

interface HelpIconButtonProps {
  /** ID from HELP_TOPICS (e.g. "app.main", "analytics.overview") */
  topicId: string;
  tooltip?: string;
}

export const HelpIconButton: React.FC<HelpIconButtonProps> = ({ topicId, tooltip }) => {
  const { openHelp } = useHelp();
  const { t } = useTranslation(['common']);

  const label = t('common:actions.help');

  return (
    <Tooltip title={tooltip ?? label}>
      <IconButton
        size="small"
        onClick={() => openHelp(topicId)}
        aria-label={label}
      >
        <HelpOutlineIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default HelpIconButton;
