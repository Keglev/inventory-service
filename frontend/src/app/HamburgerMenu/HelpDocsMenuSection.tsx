/**
 * @file HelpDocsMenuSection.tsx
 * @module app/HamburgerMenu/HelpDocsMenuSection
 *
 * @summary
 * Help & Documentation section with links to GitHub README, API Docs, and Frontend Docs.
 * Provides quick access to key resources for users.
 * @example
 * ```tsx
 * <HelpDocsMenuSection />
 * ```
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
      label: t('help.github', 'GitHub Repository'),
      href: 'https://github.com/Keglev/inventory-service',
    },
    {
      key: 'apiDocs',
      label: t('help.apiDocs', 'Open API Docs'),
      href: '/docs/api',
    },
    {
      key: 'frontendDocs',
      label: t('help.frontendDocs', 'Frontend Docs'),
      href: '/docs/frontend',
    },
  ];

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
        {t('help.title', 'Hilfe & Dokumentation / Help & Docs')}
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
