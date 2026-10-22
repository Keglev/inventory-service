/**
 * @file rechartsSectionStub.tsx
 * @module __tests__/pages/analytics/sections/rechartsSectionStub
 * @description Shared Recharts stub (fork 5b B1, 2026-10-22: an exception to
 * fork 2 A for this one mock) for the section orchestration specs, which
 * assert on data flow and only need the charts to render as plain markers.
 * Line records its props in `lineProps` for the one spec that reads them.
 * Specs whose assertions read their own stub's output keep their own stub.
 * Consumers: MovementsSection.test.tsx, EmployeesSection.test.tsx, each via
 * vi.mock('recharts', () => import(<this module>)).
 */
import type * as React from 'react';

/** Props of every Line rendered since the consumer last cleared the array. */
// eslint-disable-next-line react-refresh/only-export-components -- test-only module, never hot-reloaded
export const lineProps: Array<Record<string, unknown>> = [];

export const ResponsiveContainer = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="chart-container">{children}</div>
);
export const BarChart = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="bar-chart">{children}</div>
);
export const LineChart = ({ children }: { children?: React.ReactNode }) => (
  <div data-testid="line-chart">{children}</div>
);
export const Bar = () => <div data-testid="bar" />;
export const Line = (props: Record<string, unknown>) => {
  lineProps.push(props);
  return <div data-testid="line" />;
};
export const CartesianGrid = () => <div data-testid="cartesian-grid" />;
export const XAxis = () => <div data-testid="x-axis" />;
export const YAxis = () => <div data-testid="y-axis" />;
export const Tooltip = () => <div data-testid="tooltip" />;
export const Legend = () => <div data-testid="legend" />;
