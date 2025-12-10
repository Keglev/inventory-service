/**
 * @file NotificationLoadingState.tsx
 * @module app/HamburgerMenu/NotificationSettings/NotificationLoadingState
 *
 * @summary
 * Loading skeleton display for notifications while metrics are being fetched.
 * Shows placeholder skeletons to maintain consistent UI spacing.
 *
 * @example
 * ```tsx
 * <NotificationLoadingState />
 * ```
 */

import { Stack, Skeleton } from '@mui/material';

/**
 * Notification loading state component.
 *
 * Displays skeleton loaders while dashboard metrics are loading.
 *
 * @returns JSX element showing loading placeholders
 */
export default function NotificationLoadingState() {
  return (
    <Stack spacing={0.5} sx={{ p: 1 }}>
      <Skeleton variant="text" width={160} />
      <Skeleton variant="text" width={120} />
    </Stack>
  );
}
