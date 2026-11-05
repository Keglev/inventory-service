/**
 * @file useHelp.ts
 * @module hooks/useHelp
 * @summary Convenience hook bridging HelpContext to the component tree.
 * @enterprise
 * - Built via createContextHook (shared factory with useAuth, useSettings).
 * - Production consumers: HelpPanel and HelpIconButton; the dialogs reach help
 *   through HelpIconButton, with a topic id from the registry at help/topics.ts.
 * - HelpContext is imported from context/help/HelpContext.types (the types
 *   module owns the context object, separating type/value surface for HMR +
 *   test mocking).
 */

import { HelpContext, type HelpContextType } from '../context/help/HelpContext.types';
import { createContextHook } from './createContextHook';

/**
 * Access global help context from anywhere in the component tree.
 * @returns Help context with state and functions
 * @throws Error if used outside HelpProvider
 */
export const useHelp = createContextHook<HelpContextType>(HelpContext, 'useHelp');
