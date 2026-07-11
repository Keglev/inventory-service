/**
 * @file FooterLinks.tsx
 * @module app/footer/FooterLinks
 *
 * @summary
 * Footer documentation and legal links rendered as a compact inline row.
 *
 * @enterprise
 * - Pure presentational leaf: props-only, no state.
 * - Documentation and API Reference open the published GitHub Pages docs in a
 *   new tab (SAP-style external-link behavior).
 * - Impressum / Datenschutz are internal SPA routes rendered via react-router
 *   Link (same tab, history push), so the browser back button returns the
 *   user to the page they came from.
 * - Labels are i18n keys in the 'footer' namespace.
 */

import { Link, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** External or mailto link rendered as a plain anchor. */
interface ExternalFooterLink {
  label: string;
  href: string;
  external: boolean;
}

/** Internal SPA route rendered via react-router. */
interface InternalFooterLink {
  label: string;
  to: string;
}

type FooterLinkItem = ExternalFooterLink | InternalFooterLink;

/**
 * Footer link row component.
 *
 * Renders documentation, API reference, contact, and legal links as a
 * single inline row for the compact footer bar.
 *
 * @returns JSX element rendering the footer link row
 */
export default function FooterLinks() {
  const { t } = useTranslation(['footer']);

  const links: FooterLinkItem[] = [
    {
      label: t('footer:support.documentation'),
      href: 'https://keglev.github.io/inventory-service/',
      external: true,
    },
    {
      label: t('footer:support.apiRef'),
      href: 'https://keglev.github.io/inventory-service/backend/api/index.html',
      external: true,
    },
    {
      label: t('footer:support.frontendDocs'),
      href: 'https://keglev.github.io/inventory-service/frontend/architecture/overview.html',
      external: true,
    },
    {
      label: t('footer:support.releaseNotes'),
      href: 'https://github.com/Keglev/inventory-service/releases',
      external: true,
    },
    {
      label: t('footer:support.contact'),
      href: 'mailto:carlos.keglevich@gmail.com',
      external: false,
    },
    {
      label: t('footer:legal.impressum'),
      to: '/impressum',
    },
    {
      label: t('footer:legal.privacy'),
      to: '/datenschutz',
    },
  ];

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{ flexShrink: 0 }}
    >
      {links.map((link) =>
        'to' in link ? (
          <Link
            key={link.label}
            component={RouterLink}
            to={link.to}
            underline="hover"
            variant="caption"
            sx={{ color: 'primary.main' }}
          >
            {link.label}
          </Link>
        ) : (
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
        )
      )}
    </Stack>
  );
}
