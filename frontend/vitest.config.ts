/**
 * @file vitest.config.ts
 * @module vitest.config
 *
 * @summary
 * Vitest configuration for the React frontend test suite.
 *
 * @enterprise
 * Extends vite.config.ts through mergeConfig, so the React plugin and the '@'
 * alias are declared once. Test-only concerns (jsdom environment, MUI stubs,
 * coverage settings) stay here and do not bleed into the production build
 * config.
 */

import path from 'path';

import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config.ts';

// MUI icon and DataGrid imports are heavyweight at test time; these aliases redirect them
// to lightweight stubs so individual tests load in milliseconds rather than seconds.
// Order matters: the DataGrid sub-paths must match before the bare package name.
const testAliases = [
  {
    find: /^@mui\/icons-material\/.+$/,
    replacement: path.resolve(import.meta.dirname, './src/__tests__/stubs/MuiIconStub.tsx'),
  },
  {
    find: '@mui/x-data-grid/esm/index.css',
    replacement: path.resolve(import.meta.dirname, './src/__tests__/stubs/empty.css'),
  },
  {
    find: /^@mui\/x-data-grid\/locales$/,
    replacement: path.resolve(import.meta.dirname, './src/__tests__/stubs/DataGridLocalesStub.ts'),
  },
  {
    find: '@mui/x-data-grid/themeAugmentation',
    replacement: path.resolve(
      import.meta.dirname,
      './src/__tests__/stubs/DataGridThemeAugmentationStub.ts'
    ),
  },
  {
    find: '@mui/x-data-grid',
    replacement: path.resolve(import.meta.dirname, './src/__tests__/stubs/DataGridStub.tsx'),
  },
];

export default mergeConfig(viteConfig, defineConfig({
  resolve: { alias: testAliases },
  test: {
    // React components require a browser-like DOM; jsdom provides it without a real browser.
    environment: 'jsdom',
    // Avoids importing describe/it/expect in every test file; matches Jest's API surface.
    globals: true,
    // No exclude list: include already limits the run to src/, where none of
    // node_modules, dist, docs, coverage or the tool folders live.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['src/__tests__/test/setupTests.ts'],
    clearMocks: true,
    restoreMocks: true,
    deps: {
      optimizer: {
        client: {
          // Vite's ESM optimizer can interfere with CJS modules resolved through jsdom;
          // disabling it avoids transform errors on certain MUI internals.
          enabled: false,
        },
      },
    },
    coverage: {
      // V8 is built into Node; faster than istanbul and requires no instrumentation pass.
      provider: 'v8',
      reporter: ['text', 'html', 'lcovonly'],
      reportsDirectory: './coverage',
      // Vitest has no coverage.all since v4: the explicit include keeps untested files
      // in the report's denominator, not only the files a test touched.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        // Type-only modules emit no runtime code; excluded so the report lists only
        // code that can run.
        '**/*.types.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/index.ts',
        'src/**/index.tsx',
        'src/__tests__/**',
      ],
      // Floors just under the measured coverage, above the 85% standard, so a regression
      // fails one change old (the JaCoCo bundle rule's counterpart); branches have the
      // widest margin. Global, not perFile: a per-file floor fails on ordinary work.
      thresholds: {
        statements: 97,
        branches: 94,
        functions: 97,
        lines: 97,
      },
    },
  },
}));
