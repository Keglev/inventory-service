/**
 * @file createContextHook.ts
 * @module hooks/createContextHook
 * @summary Factory that builds a type-safe context-access hook with a guarded
 *   null-check and consistent error messaging.
 * @enterprise
 * - Used ONLY by 3 sibling hooks (useAuth, useHelp, useSettings) to eliminate
 *   the useContext + null-check + throw triplet repeated per context.
 * - Returns a closure capturing hookName so each derived hook throws with its
 *   own identity ("useAuth must be used within...").
 * - Generic factory: callers parameterize T and pass a Context<T|undefined>.
 *   Provider is responsible for never passing undefined as value.
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
    if (value === undefined) {
      throw new Error(`${hookName} must be used within the corresponding provider`);
    }
    return value;
  };
}
