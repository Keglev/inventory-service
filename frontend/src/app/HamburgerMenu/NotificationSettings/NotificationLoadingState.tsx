/**
 * @file NotificationLoadingState.tsx
 * @module app/HamburgerMenu/NotificationSettings/NotificationLoadingState
 *
 * @summary
 * DEAD IN PRODUCTION — NotificationsMenuSection reimplements this JSX inline and does
 * not import this component; only test files consume it. Would render skeletons during
 * metrics fetch.
 *
 * @enterprise
 * - Zero production importers; NotificationsMenuSection duplicates this JSX inline
 *   instead of importing (see CB-APP12).
 *
 * @example
 * ```tsx
 * <NotificationLoadingState />
 * ```
 */

import { Stack, Skeleton } from '@mui/material';

export default function NotificationLoadingState() {
  // BUCKET: dead in production — NotificationsMenuSection reimplements this JSX inline; either wire it or delete the dir (CB-APP12)
  return (
    <Stack spacing={0.5} sx={{ p: 1 }}>
      <Skeleton variant="text" width={160} />
      <Skeleton variant="text" width={120} />
    </Stack>
  );
}
