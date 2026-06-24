// ESLint flat config for the Vite + React + TypeScript frontend.
// Uses typescript-eslint, react-hooks, and react-refresh plugins to enforce
// correctness and hot-reload compatibility across all TypeScript source files.

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // create-vite scaffold default; ESLint recommends "latest" — upgrade if no older browser targets exist.
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
])
