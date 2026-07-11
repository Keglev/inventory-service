/**
 * @file HelpDocsMenuSection.tsx
 * @module app/HamburgerMenu/HelpDocsMenuSection
 *
 * @summary
 * Static links section; no hooks beyond useTranslation. Renders three
 * documentation links, all opened in a new tab with rel="noopener noreferrer".
 *
 * @enterprise
 * Two hrefs are relative paths (/docs/api, /docs/frontend) that target the
 * GitHub Pages docs site — these are real destinations. The third is an
 * absolute GitHub URL. Contrast with FooterLinks where three of
 * four hrefs are '#' placeholders. Mounted exclusively by
 * MenuContent/MenuSectionsRenderer.
 */

import {
  Box,
  Typography,
  Stack,
  Link,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';

export default function HelpDocsMenuSection() {
  const { t } = useTranslation(['common']);

  const docsLinks = [
    {
      key: 'github',
      label: t('help.github'),
      href: 'https://github.com/Keglev/inventory-service',
    },
    {
      key: 'apiDocs',
      label: t('help.apiDocs'),
      href: '/docs/api',
    },
    {
      key: 'frontendDocs',
      label: t('help.frontendDocs'),
      href: '/docs/frontend',
    },
  ];

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('help.title')}
      </Typography>

      <Stack spacing={0.75}>
        {docsLinks.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.875rem',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            <Typography variant="caption">{link.label}</Typography>
            <OpenInNewIcon sx={{ fontSize: 14 }} />
          </Link>
        ))}
      </Stack>
    </Box>
  );
}
