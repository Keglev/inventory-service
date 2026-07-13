<a id="top"></a>

[⬅️ Back to i18n Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Namespaces & JSON resources

Smart Supply Pro uses **namespaced translation bundles**, loaded from `public/locales/`.

## File layout

The backend loader path is:

- `public/locales/{lng}/{ns}.json`

Example (English):

- `frontend/public/locales/en/common.json`
- `frontend/public/locales/en/inventory.json`
- `frontend/public/locales/en/help.json`

Example (German):

- `frontend/public/locales/de/common.json`
- `frontend/public/locales/de/inventory.json`
- `frontend/public/locales/de/help.json`

## Namespace responsibilities

- `common`: shared/global UI (navigation, generic actions)
- `<domain>` namespaces (`inventory`, `suppliers`, `analytics`, …): domain-specific UI
- `system`: system-level pages (404, generic system states)
- `errors`: user-facing error messages
- `help`: help topic text (titles + body + optional link label)

## How namespaces are declared

- The canonical namespace list is a constant in `frontend/src/i18n/index.ts`.
- That list is also used to load all namespaces at startup.

## Adding a new translation key

1. Add the key under the appropriate namespace JSON:
   - `frontend/public/locales/en/<ns>.json`
   - `frontend/public/locales/de/<ns>.json`
2. If you added a **new namespace** file:
   - add it to the namespace list constant
   - add it to `frontend/src/i18n/resources.d.ts` imports and `resources` map
3. Use it from code:
   - `const { t } = useTranslation('<ns>')`
   - `t('<path.to.key>')`

## Help topics as i18n-backed content

Help topics are registered in `frontend/src/help/topics.ts`.

Each topic maps to i18n keys like:

- `help:<topicId>.title`
- `help:<topicId>.body`

This keeps help content localized and centralized.

---

```mermaid
graph LR
  Topics[HELP_TOPICS registry] --> Keys[i18n keys
help:*.title/body]
  Keys --> JSON[public/locales/{lng}/help.json]
  JSON --> UI[Help UI renders t(key)]
```

---

[Back to top](#top)
