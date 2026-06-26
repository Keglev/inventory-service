/**
 * @file HelpPanel.tsx
 * @module components/help/HelpPanel
 * @summary Global help drawer subscribing to HelpContext; renders an MUI
 * Drawer with topic title, body, and optional documentation link.
 *
 * @enterprise
 * - Mounted ONCE at the app composition root (App.tsx), NOT inside AppShell.
 *   Single instance for the whole app; HelpProvider's state determines what
 *   (if anything) it renders.
 * - Render gated: returns null when no topic is selected, when the drawer is
 *   closed, or when the topic id is not registered in help/topics.ts. Safe to
 *   render unconditionally from App.tsx.
 * - Topic content is i18n-resolved at render time. Topic keys come from a
 *   runtime registry (help/topics.ts), not the typed i18next augmentation —
 *   see the translate() helper for the deliberate type bypass.
 * - Drawer width is responsive (full-width on xs, configurable on sm+);
 *   Escape-to-close is provided by MUI Drawer's default onClose behavior,
 *   not custom code.
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

const HelpPanel: React.FC<HelpPanelProps> = ({ width = 420, position = 'right' }) => {
  const { currentTopicId, isOpen, closeHelp } = useHelp();
  const { t } = useTranslation('help');

  // WHY: topic keys are runtime strings from help/topics.ts and cannot satisfy i18next's typed key
  // union (CustomTypeOptions in resources.d.ts) — double-cast preserves return type while bypassing
  // the augmentation.
  const translate = (key: string): string => (t as unknown as (k: string) => string)(key);

  if (!currentTopicId || !isOpen) {
    return null;
  }

  const topic = getHelpTopic(currentTopicId);
  if (!topic) {
    return null;
  }

  return (
    <Drawer
      anchor={position}
      open={isOpen}
      onClose={closeHelp}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 10,
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: width },
          maxHeight: '100vh',
          overflow: 'auto',
          boxShadow: 3,
        },
      }}
    >
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
          {translate(topic.titleKey)}
        </Typography>
        <IconButton onClick={closeHelp} size="small" sx={{ ml: 1 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}
        >
          {translate(topic.bodyKey)}
        </Typography>

        {/* WHY: rendered only when topic.linkKey is present in the registry; many topics have no external docs */}
        {topic.linkKey && (
          <>
            <Divider />
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<OpenInNewIcon />}
                onClick={() => {
                  // BUCKET: documentation-link button onClick only closes the drawer; either wire to a real URL or remove the button (CB-APP25)
                  closeHelp();
                }}
                sx={{ textTransform: 'none' }}
              >
                {translate(topic.linkKey)}
              </Button>
            </Stack>
          </>
        )}
      </Box>

      <Box sx={{ flex: 1 }} />

      {/* BUCKET: hardcoded English fallback in DE-default app — verify de/help.json has general.closeHint or remove fallback (CM-APP7) */}
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
