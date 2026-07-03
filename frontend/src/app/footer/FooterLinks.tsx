/**
 * @file FooterLinks.tsx
 * @module app/footer/FooterLinks
 *
 * @summary
 * Footer documentation links rendered as a compact inline row.
 *
 * @enterprise
 * - Pure presentational leaf: props-only, no state.
 * - Documentation and API Reference open the published GitHub Pages docs in a
 *   new tab (SAP-style external-link behavior).
 * - Labels are i18n keys in the 'footer' namespace with English fallbacks.
 * - Impressum / Datenschutz links join this row via CB-APP84.
 */

import { Link, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Footer documentation links component.
 *
 * Renders documentation, API reference, and support links as a single
 * inline row for the compact footer bar.
 *
 * @returns JSX element rendering the footer link row
 */
export default function FooterLinks() {
  const { t } = useTranslation(['footer']);

  const links = [
    {
      label: t('footer:support.documentation', 'Documentation'),
      href: 'https://keglev.github.io/inventory-service/',
      external: true,
    },
    {
      label: t('footer:support.apiRef', 'API Reference'),
      href: 'https://keglev.github.io/inventory-service/backend/api/index.html',
      external: true,
    },
    {
      label: t('footer:support.contact', 'Contact Support'),
      href: 'mailto:support@smartsupplypro.com',
      external: false,
    },
  ];

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{ flexShrink: 0 }}
    >
      {links.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
          underline="hover"
          variant="caption"
          sx={{ color: 'primary.main' }}
        >
          {link.label}
        </Link>
      ))}
    </Stack>
  );
}
