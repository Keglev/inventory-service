<a id="top"></a>

[⬅️ Back to i18n Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Initialization & language selection

The i18n bootstrapping lives in `frontend/src/i18n/index.ts` and is imported once (side-effect) from the app entry point.

## Where i18n is initialized

- `frontend/src/i18n/index.ts` initializes i18next and exports the configured `i18n` instance.
- The app should import it once (typically from `frontend/src/main.tsx`):
  - `import './i18n'`

## German-first behavior (enterprise default)

On first visit, the UI language is forced to **German**:

- LocalStorage key: `i18nextLng`
- If the key does not exist:
  - the code sets it to `de`
  - and initializes i18next with `lng: 'de'`

This ensures “German-first impression”, while still allowing users to override and persist English.

## Detection order and persistence

The app uses `i18next-browser-languagedetector`, with detection order:

1. `localStorage` (wins if previously selected)
2. `querystring` (useful for support/testing)
3. `navigator` (browser default)

Persistence uses i18next’s standard localStorage cache with the key `i18nextLng`.

## Resource loading layout

The runtime JSON loader (`i18next-http-backend`) loads:

- `/locales/{{lng}}/{{ns}}.json`

The `loadPath` is built from Vite’s base URL:

- `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json`

## Namespaces

The list of maintained namespaces is defined as a constant (e.g. `common`, `auth`, `inventory`, `help`, …).

After `init()`, the code explicitly calls `i18n.loadNamespaces(...)` to ensure all namespaces are loaded.

## Debugging helpers

In dev mode, the i18n instance is exposed on `window.i18next` and logs lifecycle events (`initialized`, `loaded`, `languageChanged`).

---

```mermaid
graph TD
  Boot[import './i18n'] --> Init[i18n.init(...)]
  Init --> Detect[resolve lng]
  Detect --> Lng[lng = saved || 'de']
  Init --> Load[backend loads JSON]
  Load --> Ready[UI can translate]
```

---

[Back to top](#top)
