// ESLint flat config for the Vite + React + TypeScript frontend.
// Uses typescript-eslint, react-hooks, and react-refresh plugins to enforce
// correctness and hot-reload compatibility across all TypeScript source files.
// defineConfig comes from ESLint core: typescript-eslint deprecated its own
// config() helper in its favour.

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 'coverage' holds the generated Istanbul report: vendored scripts that carry
  // their own disable directives and are not ours to fix. It is gitignored, but
  // it exists on any machine that has run the suite with --coverage, and under
  // --max-warnings 0 linting it would fail the run.
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // Since react-hooks 7 the flat presets live under configs.flat; the
      // top-level keys are the legacy eslintrc form (plugins as an array),
      // which ESLint 10 rejects. 'recommended-latest' adds the React Compiler
      // rules on top of rules-of-hooks and exhaustive-deps.
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // create-vite scaffold default; ESLint recommends "latest" — upgrade if no older browser targets exist.
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
