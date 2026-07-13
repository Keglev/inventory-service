<a id="top"></a>

[⬅️ Back to UI & UX Building Blocks Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Help system (topics + trigger button)

The help system is designed so that:

- help topic metadata is centralized
- help text is fully localized (i18n-backed)
- UI can open help contextually from any screen

## Building blocks

1. **Topic registry**: `frontend/src/help/topics.ts`
   - `HELP_TOPICS` maps a `topicId` to i18n keys (`titleKey`, `bodyKey`, optional `linkKey`)

2. **Global state**: `frontend/src/context/help/HelpContext.tsx`
   - `HelpProvider` stores `isOpen` + `currentTopicId`
   - closes on `Escape`

3. **Trigger button**: `frontend/src/features/help/components/HelpIconButton.tsx`
   - renders a consistent icon button
   - calls `openHelp(topicId)`

4. **Convenience hook**: `frontend/src/hooks/useHelp.ts`
   - `useHelp()` is a typed wrapper around HelpContext

## Adding a new help topic

1. Add metadata entry to `HELP_TOPICS`
2. Add localized strings to `public/locales/{de,en}/help.json`
3. Add a `HelpIconButton topicId="..."` near the relevant UI

---

```mermaid
graph LR
  Icon[HelpIconButton] --> Open[openHelp(topicId)]
  Open --> Ctx[HelpContext]
  Ctx --> Topic[HELP_TOPICS lookup]
  Topic --> I18N[i18n t(titleKey/bodyKey)]
```

---

[Back to top](#top)
