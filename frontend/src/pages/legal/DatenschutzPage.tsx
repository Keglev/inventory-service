/**
 * @file DatenschutzPage.tsx
 * @module pages/legal/DatenschutzPage
 *
 * @summary
 * Public privacy policy (Datenschutzerklärung) page. All content lives in
 * the 'legal' i18n namespace; the language toggle flips de/en.
 *
 * @enterprise
 * - Art. 13 GDPR information covering exactly what this app does: hosting
 *   server logs (Koyeb/Fly.io), Google OAuth sign-in, technically required
 *   LocalStorage (no consent banner needed, § 25 (2) TDDDG), demo data,
 *   EU/US transfer note, retention, data-subject rights.
 * - Section list is a typed const array; adding a section means adding the
 *   JSON keys and one entry here — no structural edits.
 */

import * as React from 'react';
import { Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import LegalPageLayout from './LegalPageLayout';

/** Ordered privacy section keys; each maps to privacy.<key>.title/.body in legal.json. */
const SECTIONS = [
  'controller',
  'hosting',
  'oauth',
  'localStorage',
  'demoData',
  'transfer',
  'retention',
  'rights',
  'complaint',
] as const;

/**
 * Privacy policy page component.
 *
 * @returns JSX element rendering the localized privacy policy.
 */
const DatenschutzPage: React.FC = () => {
  const { t } = useTranslation('legal');

  return (
    <LegalPageLayout title={t('privacy.title')}>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {t('privacy.intro')}
      </Typography>

      {SECTIONS.map((key) => (
        <React.Fragment key={key}>
          <Typography variant="h6" component="h2" gutterBottom>
            {t(`privacy.${key}.title`)}
          </Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
            {t(`privacy.${key}.body`)}
          </Typography>
        </React.Fragment>
      ))}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        {t('privacy.updated')}
      </Typography>
    </LegalPageLayout>
  );
};

export default DatenschutzPage;
