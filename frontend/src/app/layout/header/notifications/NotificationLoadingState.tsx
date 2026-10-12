/**
 * @file NotificationLoadingState.tsx
 * @module app/HamburgerMenu/NotificationSettings/NotificationLoadingState
 *
 * @summary
 * Renders skeletons while the notification metrics are loading.
 *
 * @enterprise
 * - Mounted by NotificationsMenuSection while useDashboardMetrics is loading.
 *
 * @example
 * ```tsx
 * <NotificationLoadingState />
 * ```
 */

import { Stack, Skeleton } from '@mui/material';

export default function NotificationLoadingState() {
  return (
    <Stack spacing={0.5} sx={{ p: 1 }}>
      <Skeleton variant="text" width={160} />
      <Skeleton variant="text" width={120} />
    </Stack>
  );
}
