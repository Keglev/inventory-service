/**
 * @file ChartCard.tsx
 * @module pages/analytics/components/ChartCard
 *
 * @summary
 * Card scaffolding shared by the analytics chart cards: a title, then a
 * loading skeleton, a no-data message, or the chart in a responsive box.
 *
 * @enterprise
 * The stock value, monthly movement and reason breakdown cards each repeated
 * this card, title, skeleton, empty box and ResponsiveContainer (P-R4, jscpd).
 * Each card now owns only its query and its chart. ChartPlaceholder is the
 * centred message box, also used for the price trend's prompts.
 */
import type { ReactElement, ReactNode } from 'react';
import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';
import { ResponsiveContainer } from 'recharts';

/** Centred secondary text in a box of the given height: a prompt or a no-data message. */
export function ChartPlaceholder({ height = 220, children }: { height?: number; children: ReactNode }) {
  return <Box sx={{ height, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>{children}</Box>;
}

export type ChartCardProps = {
  /** Card heading (already translated). */
  title: ReactNode;
  /** Shows the skeleton instead of the chart. */
  loading: boolean;
  /** Shows `emptyText` instead of the chart. */
  empty: boolean;
  /** Message for the empty state (already translated). */
  emptyText: ReactNode;
  /** Height of the chart box in px. */
  height?: number;
  /** Height of the skeleton in px. */
  skeletonHeight?: number;
  /** Height of the empty-state box in px. */
  emptyHeight?: number;
  /** data-testid on the card. */
  testId?: string;
  /** The Recharts chart; it fills the box through a ResponsiveContainer. */
  children: ReactElement;
};

export default function ChartCard({
  title,
  loading,
  empty,
  emptyText,
  height = 260,
  skeletonHeight = 220,
  emptyHeight = 220,
  testId,
  children,
}: ChartCardProps) {
  return (
    <Card data-testid={testId}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {loading ? (
          <Skeleton variant="rounded" height={skeletonHeight} />
        ) : empty ? (
          <ChartPlaceholder height={emptyHeight}>{emptyText}</ChartPlaceholder>
        ) : (
          <Box sx={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
