/**
 * @file Dashboard.tsx
 * @description
 * Minimal post-login landing. Confirms session and shows a backend health probe.
 * Future: KPI cards and analytics previews.
 * @enterprise
 * - Keep this page simple until Analytics/KPIs are ready.
 * Includes a visible TODO checklist so reviewers see whats's next
 */
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Box, Typography, Chip, Stack, Divider } from '@mui/material';
import { useAuth } from '../../context/useAuth';
import { testConnection } from '../../api/testConnection';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'checking' | 'ok' | 'fail'>('checking');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await testConnection().catch(() => false);
      if (!cancelled) setStatus(ok ? 'ok' : 'fail');
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Typography variant="body1" gutterBottom>
        Login successful{user?.fullName ? `, ${user.fullName}!` : '!'}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ my: 1 }}>
        <Typography variant="body2">Backend status:</Typography>
        <Chip
          size="small"
          label={status === 'checking' ? 'Checking…' : status === 'ok' ? 'OK' : 'Connection failed'}
          color={status === 'ok' ? 'success' : status === 'fail' ? 'error' : 'default'}
          variant="outlined"
        />
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* ------------------------------------------------------------------
         TODO: First implementation batch (Phase 2 shell + KPIs)
         - [ ] Replace this page with SAP/Fiori-style overview (KPI cards + mini charts)
         - [ ] Header actions already live in AppShell (language, density, profile)
         - [ ] Wire stub data for 3 KPI cards (Inventory, Suppliers)
         - [ ] Add /analytics stubs for deep-dive pages
         ------------------------------------------------------------------ */}
      <Typography variant="overline" color="text.secondary">
        Coming soon
      </Typography>
      <Typography variant="body2" color="text.secondary">
        KPI cards and analytics previews will appear here.
      </Typography>
    </Box>
  );
};

export default Dashboard;
