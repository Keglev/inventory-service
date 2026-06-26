/**
 * @file useHelp.ts
 * @module hooks/useHelp
 * @summary Convenience hook bridging HelpContext to the component tree.
 * @enterprise
 * - Built via createContextHook (shared factory with useAuth, useSettings).
 * - Seven production consumers: HelpPanel, HelpIconButton, and five dialog
 *   files across pages/inventory and pages/suppliers — each calls openHelp()
 *   with a topic id sourced from the topic registry at help/topics.ts.
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
