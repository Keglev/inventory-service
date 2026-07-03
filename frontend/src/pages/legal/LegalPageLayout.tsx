/**
 * @file LegalPageLayout.tsx
 * @module pages/legal/LegalPageLayout
 *
 * @summary
 * Shared layout for the public legal pages (Impressum, Datenschutz):
 * constrained column, history-aware back button, page title.
 *
 * @enterprise
 * - Back button uses navigate(-1) only when in-app history exists
 *   (react-router seeds window.history.state.idx; idx > 0 means the user
 *   navigated here from inside the SPA). Direct entries (external link,
 *   bookmark) fall back to the landing page instead of leaving the site.
 * - Rendered inside AppPublicShell, so public header/footer and the active
 *   theme wrap this layout automatically.
 */

import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LegalPageLayoutProps {
  /** Localized page title rendered as the h1. */
  title: string;
  /** Section content (Typography blocks) provided by the concrete page. */
  children: React.ReactNode;
}

/**
 * Layout wrapper for legal content pages.
 *
 * @param props - Title and section content.
 * @returns JSX element rendering back button, title, and content column.
 */
export default function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('legal');

  const handleBack = () => {
    // WHY: idx > 0 means there is an in-app entry to return to; a direct
    // visit (idx 0 or missing) would otherwise navigate off-site.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto', pb: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        {t('back')}
      </Button>

      <Typography variant="h4" component="h1" gutterBottom>
        {title}
      </Typography>

      {children}
    </Box>
  );
}
