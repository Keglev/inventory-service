// Vitest configuration for the React frontend test suite.
// Kept separate from vite.config.ts so test-only concerns (jsdom environment, MUI stubs,
// coverage settings) do not bleed into the production build config or slow down CI caching.

import path from 'path';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// MUI icon and DataGrid imports are heavyweight at test time; these aliases redirect them
// to lightweight stubs so individual tests load in milliseconds rather than seconds.
const isTest = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test';

const testAliases = isTest
  ? [
      {
        find: /^@mui\/icons-material\/.+$/,
        replacement: path.resolve(__dirname, './src/__tests__/stubs/MuiIconStub.tsx'),
      },
      {
        find: '@mui/x-data-grid/esm/index.css',
        replacement: path.resolve(__dirname, './src/__tests__/stubs/empty.css'),
      },
      {
        find: /^@mui\/x-data-grid\/locales$/,
        replacement: path.resolve(__dirname, './src/__tests__/stubs/DataGridLocalesStub.ts'),
      },
      {
        find: '@mui/x-data-grid/themeAugmentation',
        replacement: path.resolve(
          __dirname,
          './src/__tests__/stubs/DataGridThemeAugmentationStub.ts'
        ),
      },
      {
        find: '@mui/x-data-grid',
        replacement: path.resolve(__dirname, './src/__tests__/stubs/DataGridStub.tsx'),
      },
    ]
  : [];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      ...testAliases,
    ],
  },
  test: {
    // React components require a browser-like DOM; jsdom provides it without a real browser.
    environment: 'jsdom',
    // Avoids importing describe/it/expect in every test file; matches Jest's API surface.
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/docs/**',
      '**/coverage/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
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
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      // v4 removed coverage.all; an explicit include preserves the full-source denominator
      // so untested files remain visible in the published report (not just test-touched files).
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        // Type-only modules emit no runtime code, so istanbul reports them as 0% of 0
        // statements. They are excluded so a per-file coverage floor measures code that
        // can actually be executed.
        '**/*.types.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/index.ts',
        'src/**/index.tsx',
        'src/__tests__/**',
      ],
    },
  },
});
