/**
 * @file createContextHook.ts
 * @description
 * Factory function for creating type-safe context access hooks.
 * Eliminates boilerplate by providing a reusable pattern for context consumption.
 *
 * @usage
 * const useMyContext = createContextHook(MyContext, 'useMyContext')
 * const value = useMyContext()
 */

import { useContext, type Context } from 'react';

/**
 * Create a type-safe hook for accessing a React context.
 * @param context - The React context to access (initialized with undefined)
 * @param hookName - Name of the hook (used in error message)
 * @returns A hook function that provides the context value or throws an error
 * @throws Error if used outside the context provider
 */
export function createContextHook<T>(
  context: Context<T | undefined>,
  hookName: string,
): () => T {
  return (): T => {
    const value = useContext(context) as T | undefined;
    if (!value) {
      throw new Error(`${hookName} must be used within the corresponding provider`);
    }
    return value;
  };
}
