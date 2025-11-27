/**
 * @file HelpPanel.tsx
 * @description
 * Global help drawer component that displays help topics.
 * Renders as a right-side drawer and can be opened/closed from anywhere.
 *
 * @enterprise
 * - Right-side drawer (non-intrusive)
 * - Smooth transitions
 * - Responsive on mobile (full width)
 * - Close button and Escape key support
 *
 * @usage
 * Place at root of AppShell or layout:
 * <HelpPanel />
 */
import * as React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';
import { useHelp } from '../../hooks/useHelp';
import { getHelpTopic } from '../../help/topics';

interface HelpPanelProps {
  /** Width of drawer on desktop */
  width?: number;
  /** Drawer position */
  position?: 'right' | 'left';
}

/**
 * HelpPanel: Global help drawer component
 * Displays help topic content retrieved from context
 */
const HelpPanel: React.FC<HelpPanelProps> = ({ width = 420, position = 'right' }) => {
  const { currentTopicId, isOpen, closeHelp } = useHelp();
  const { t } = useTranslation('help');

  // If no topic selected or drawer is closed, don't render
  if (!currentTopicId || !isOpen) {
    return null;
  }

  // Get topic metadata
  const topic = getHelpTopic(currentTopicId);
  if (!topic) {
    return null;
  }

  return (
    <Drawer
      anchor={position}
      open={isOpen}
      onClose={closeHelp}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: width },
          maxHeight: '100vh',
          overflow: 'auto',
          boxShadow: 3,
        },
      }}
    >
      {/* Header with title and close button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
          {t(topic.titleKey)}
        </Typography>
        <IconButton onClick={closeHelp} size="small" sx={{ ml: 1 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Help body text */}
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {t(topic.bodyKey)}
        </Typography>

        {/* Optional: documentation link */}
        {topic.linkKey && (
          <>
            <Divider />
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon />}
                onClick={() => {
                  // Future: Open documentation URL
                  closeHelp();
                }}
                sx={{ textTransform: 'none' }}
              >
                {t(topic.linkKey)}
              </Button>
            </Stack>
          </>
        )}
      </Box>

      {/* Footer spacer */}
      <Box sx={{ flex: 1 }} />

      {/* Footer hint */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          textAlign: 'center',
          position: 'sticky',
          bottom: 0,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {t('help:general.closeHint', 'Press Escape to close')}
        </Typography>
      </Box>
    </Drawer>
  );
};

export default HelpPanel;
