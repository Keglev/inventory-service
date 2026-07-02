/**
 * @file FooterLinks.tsx
 * @module app/footer/FooterLinks
 *
 * @summary
 * Footer support and documentation links component.
 * Displays navigation links to documentation, API reference, release notes, and support.
 *
 * @enterprise
 * - Pure presentational leaf: props-only, no state.
 * - Documentation and API Reference open the published GitHub Pages docs in a
 *   new tab (SAP-style external-link behavior); Release Notes returns once a
 *   GitHub Releases page exists.
 * - Labels are i18n keys in the 'footer' namespace with English fallbacks.
 */

import { Box, Typography, Link, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Footer support and documentation links component.
 *
 * Provides navigation links to documentation, API reference, release notes,
 * and support contact. Isolated from other footer sections for independent testing.
 *
 * @returns JSX element rendering support and documentation links
 *
 * @example
 * ```tsx
 * <FooterLinks />
 * ```
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
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, display: 'block', mb: 0.25 }}
      >
        {t('footer:section.support', 'Support & Docs')}
      </Typography>
      <Stack spacing={0.25}>
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
    </Box>
  );
}
