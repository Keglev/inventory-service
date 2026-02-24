/**
 * @file DataGridLocalesStub.ts
 * @description Test stub for the MUI/X DataGrid locale exports.
 *
 * Purpose:
 * - Provide minimal locale objects so code importing `enUS`/`deDE` can execute in tests
 *   without pulling in the full DataGrid locale bundle.
 * - Reduce test startup time and avoid coupling unit tests to DataGrid internals.
 *
 * Contract under test:
 * - Exports `enUS` and `deDE` symbols.
 * - Exports a default object containing those symbols.
 *
 * Out of scope:
 * - Actual translated strings.
 * - Shape parity with MUI locale payloads beyond being truthy objects.
 */

// These intentionally empty objects satisfy callers that only need the presence
// of a locale object. Keep them as `as const` to prevent accidental mutation.
export const enUS = {} as const;
export const deDE = {} as const;

export default {
  enUS,
  deDE,
};
