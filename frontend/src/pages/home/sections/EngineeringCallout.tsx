/**
 * @file EngineeringCallout.tsx
 * @module pages/home/sections/EngineeringCallout
 *
 * @summary
 * Landing-page block that points a technical reader at the published arc42
 * architecture documentation and the public source repository.
 *
 * @enterprise
 * - The only block that leaves the application: both links are external, open in
 *   a new tab, and carry rel="noopener noreferrer" so the opened page cannot
 *   reach back into this window.
 * - Copy deliberately avoids test counts and coverage percentages: those numbers
 *   drift with every test commit and would turn this block into a stale claim.
 * - URLs are module constants; they are deployment-independent public endpoints,
 *   not environment configuration.
 *
 * @i18n
 * Uses the 'landing' namespace, 'engineering' subtree.
 */

import * as React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useTranslation } from 'react-i18next';

const DOCS_URL = 'https://keglev.github.io/inventory-service/';
const REPO_URL = 'https://github.com/Keglev/inventory-service';

const EngineeringCallout: React.FC = () => {
  const { t } = useTranslation<'landing'>('landing');

  return (
    <Box component="section" sx={{ py: { xs: 5, md: 8 } }}>
      <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, bgcolor: 'background.paper' }}>
        <Stack spacing={2} sx={{ maxWidth: 760 }}>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
            {t('engineering.title')}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {t('engineering.body')}
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
            <Button
              variant="contained"
              startIcon={<MenuBookOutlinedIcon />}
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('engineering.docsCta')}
            </Button>
            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('engineering.repoCta')}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default EngineeringCallout;
