/**
 * @file AboutDialog.tsx
 * @module app/about/AboutDialog
 *
 * @summary
 * "About Smart Supply Pro" dialog: version, build, environment, backend status and
 * database, opened from the user menu.
 *
 * @enterprise
 * - SAP Fiori and Oracle keep version facts in one About dialog reached from the
 *   user menu (FW5 fork 3, ADR-0015); the footer keeps only a compact version line.
 * - Backend status and database come from useHealthCheck, the same query as the
 *   header badge and the footer, so the three can never disagree.
 * - The build id shows its first 10 characters; the full hash is in the title.
 */

import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, BUILD_ID, APP_ENVIRONMENT } from '../../config/appMeta';
import { useHealthCheck } from '../../features/health/hooks/useHealthCheck';

interface AboutDialogProps {
  /** Whether the dialog is open */
  open: boolean;

  /** Closes the dialog */
  onClose: () => void;
}

/** One label/value row; the value wraps instead of widening the dialog. */
function AboutRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={2} sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 120, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography component="div" variant="body2" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        {children}
      </Typography>
    </Stack>
  );
}

/**
 * About dialog.
 *
 * @param props - Component props
 * @returns the dialog; renders nothing visible while closed
 */
export default function AboutDialog({ open, onClose }: AboutDialogProps) {
  const { t } = useTranslation(['common']);
  const { health } = useHealthCheck();
  const online = health.status === 'online';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{t('about.title')}</DialogTitle>
      <DialogContent dividers>
        <AboutRow label={t('about.version')}>{APP_VERSION}</AboutRow>
        <AboutRow label={t('about.build')}>
          <span title={BUILD_ID}>{BUILD_ID.slice(0, 10)}</span>
        </AboutRow>
        <AboutRow label={t('about.environment')}>{APP_ENVIRONMENT}</AboutRow>
        <AboutRow label={t('about.backend')}>
          <Chip
            size="small"
            variant="outlined"
            color={online ? 'success' : 'error'}
            label={online ? t('about.online') : t('about.offline')}
          />
        </AboutRow>
        <AboutRow label={t('about.database')}>{health.databaseProduct ?? t('about.unknown')}</AboutRow>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
          {t('actions.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
