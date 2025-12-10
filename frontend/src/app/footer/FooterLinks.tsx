/**
 * @file FooterLinks.tsx
 * @module app/footer/FooterLinks
 *
 * @summary
 * Footer support and documentation links component.
 * Displays navigation links to documentation, API reference, release notes, and support.
 *
 * @enterprise
 * - Support and documentation link management
 * - Consistent link styling with primary color
 * - i18n support for all link labels
 * - Accessible link navigation
 * - Full TypeDoc coverage for links section
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
      href: '#',
    },
    {
      label: t('footer:support.apiRef', 'API Reference'),
      href: '#',
    },
    {
      label: t('footer:support.releaseNotes', 'Release Notes'),
      href: '#',
    },
    {
      label: t('footer:support.contact', 'Contact Support'),
      href: 'mailto:support@smartsupplypro.com',
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
