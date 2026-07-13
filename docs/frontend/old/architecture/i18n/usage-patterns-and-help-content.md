<a id="top"></a>

[⬅️ Back to i18n Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Usage patterns & help content

This page documents the preferred patterns for using translations in UI code.

## Prefer explicit namespaces

Most screens should bind a namespace explicitly:

- `const { t } = useTranslation('inventory')`

Then use local keys:

- `t('table.headers.name')`

This makes it obvious where the content lives.

## Cross-namespace usage

For truly shared keys (global navigation/actions), use `common`:

- `t('common:actions.save')`

Rule of thumb:
- keep domain pages domain-focused
- only use `common:*` for cross-cutting shared UI

## Help content is just i18n content

Help topic metadata is registered in `frontend/src/help/topics.ts`.

The registry stores **keys**, not localized strings:

- `titleKey`: e.g. `help:inventory.editItem.title`
- `bodyKey`: e.g. `help:inventory.editItem.body`

A help UI surface can then render:

- `t(topic.titleKey)`
- `t(topic.bodyKey)`

## Recommended workflow for adding help text

1. Add topic metadata to `HELP_TOPICS`
2. Add the localized key content to `help.json` in both languages
3. Use `HelpIconButton` with `topicId` to open that topic

---

```mermaid
graph LR
  Button[HelpIconButton] --> Open[openHelp(topicId)]
  Open --> Ctx[HelpContext]
  Ctx --> Topic[lookup topic metadata]
  Topic --> T[t(topicKey)]
  T --> Text[localized text]
```

---

[Back to top](#top)
