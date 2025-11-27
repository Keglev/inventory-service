import * as React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useHelp } from '../../../hooks/useHelp';

interface HelpIconButtonProps {
  /** ID from HELP_TOPICS (e.g. "app.main", "analytics.overview") */
  topicId: string;
  tooltip?: string;
}

const HelpIconButton: React.FC<HelpIconButtonProps> = ({ topicId, tooltip }) => {
  const { openHelp } = useHelp();

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
