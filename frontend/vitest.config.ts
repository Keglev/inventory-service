import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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
  // @ts-expect-error - vite and vitest have different plugin types
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      ...testAliases,
    ],
  },
  test: {
    environment: 'jsdom',
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
        web: {
          enabled: false,
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/index.ts',
        'src/**/index.tsx',
        'src/__tests__/**',
      ],
    },
  },
});
