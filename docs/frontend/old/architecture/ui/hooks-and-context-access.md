<a id="top"></a>

[⬅️ Back to UI & UX Building Blocks Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Hooks & context access pattern

The repo uses a small hook library under:

- `frontend/src/hooks/*`

This section documents the common patterns and why they exist.

## `createContextHook()` pattern

`createContextHook(context, hookName)` builds a hook that:

- reads a `Context<T | undefined>`
- throws a clear error if used outside the provider

This reduces boilerplate and standardizes error messages.

Consumers then get stable hooks like:

- `useAuth()`
- `useSettings()`
- `useHelp()`

## `useDebounced()`

`useDebounced(value, delayMs)` is a generic debounce hook used for:

- search inputs
- filter typing
- reducing API chatter

## Why this belongs in “UI” docs

Even though these hooks aren’t visual components, they strongly shape the user experience:

- consistent provider boundaries
- consistent error behavior
- consistent “input → query” pacing

---

```mermaid
graph TD
  Provider[Context Provider] --> Ctx[Context]
  Ctx --> Hook[useX() via createContextHook]
  Hook --> UI[UI consumes typed API]
```

---

[Back to top](#top)
