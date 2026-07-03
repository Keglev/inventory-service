/**
 * @file ImpressumPage.tsx
 * @module pages/legal/ImpressumPage
 *
 * @summary
 * Public Impressum (legal notice) page. All content lives in the 'legal'
 * i18n namespace, so the language toggle flips de/en like the rest of
 * the app.
 *
 * @enterprise
 * - § 5 DDG information for a private, non-commercial portfolio:
 *   name + contact email, explicit non-commercial framing, § 18 (2) MStV
 *   responsibility note. No street address by deliberate choice (CB-APP84
 *   Gate 0 decision, option 1).
 * - Public route (no auth) under AppPublicShell so the page is reachable
 *   from every screen via the footer.
 */

import * as React from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LegalPageLayout from './LegalPageLayout';

/** Section body typography with newline support for JSON multi-paragraph strings. */
const bodySx = { whiteSpace: 'pre-line', mb: 2 } as const;

/**
 * Impressum page component.
 *
 * @returns JSX element rendering the localized legal notice.
 */
const ImpressumPage: React.FC = () => {
  const { t } = useTranslation('legal');

  return (
    <LegalPageLayout title={t('impressum.title')}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('impressum.scope')}
      </Typography>

      <Typography variant="h6" component="h2" gutterBottom>
        {t('impressum.provider.title')}
      </Typography>
      <Typography variant="body1">{t('impressum.provider.name')}</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {t('impressum.provider.email')}
      </Typography>

      <Typography variant="h6" component="h2" gutterBottom>
        {t('impressum.nature.title')}
      </Typography>
      <Typography variant="body1" sx={bodySx}>
        {t('impressum.nature.body')}
      </Typography>

      <Typography variant="h6" component="h2" gutterBottom>
        {t('impressum.responsible.title')}
      </Typography>
      <Typography variant="body1" sx={bodySx}>
        {t('impressum.responsible.body')}
      </Typography>

      <Typography variant="h6" component="h2" gutterBottom>
        {t('impressum.liability.title')}
      </Typography>
      <Typography variant="body1" sx={bodySx}>
        {t('impressum.liability.body')}
      </Typography>
    </LegalPageLayout>
  );
};

export default ImpressumPage;
