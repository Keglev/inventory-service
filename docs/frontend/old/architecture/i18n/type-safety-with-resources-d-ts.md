<a id="top"></a>

[⬅️ Back to i18n Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Type safety with `resources.d.ts`

The project augments `i18next` types in `frontend/src/i18n/resources.d.ts` so that:

- `useTranslation('<ns>')` is restricted to known namespaces
- `t('...')` keys are validated against the JSON structure (compile time)

## How it works

- The file imports the **English** namespace JSON files from `frontend/public/locales/en/*.json`.
- Those imports become the “shape source of truth” for the `resources` type map.
- `declare module 'i18next' { interface CustomTypeOptions { ... } }` wires the shapes into i18next’s typing.

## Practical impact

- When you rename/move keys in JSON, TypeScript will surface broken usages.
- When you add a new namespace, you must update the typing file so the namespace becomes usable.

## Keeping it in sync

When you add a namespace:

1. Create `frontend/public/locales/en/<ns>.json` and `.../de/<ns>.json`
2. Import the new English JSON in `resources.d.ts`
3. Add it to the `resources` map
4. Add the namespace string to the namespace list in `frontend/src/i18n/index.ts`

## Rules of thumb

- Prefer namespaced calls like `t('common:actions.save')` when it improves clarity.
- Otherwise, call `useTranslation('<ns>')` and use local keys like `t('actions.save')`.

---

```mermaid
graph TD
  JSON[public/locales/en/*.json] --> DTS[resources.d.ts imports]
  DTS --> Types[i18next CustomTypeOptions]
  Types --> Dev[Type-safe t('...')]
```

---

[Back to top](#top)
