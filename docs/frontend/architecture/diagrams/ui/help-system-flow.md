<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to UI](../../ui/index.md)

# Help system flow

A diagram of how context-sensitive help is opened and rendered.

```mermaid
graph LR
  Button[HelpIconButton\n(topicId)] --> Hook[useHelp()]
  Hook --> Ctx[HelpContext\n(openHelp/closeHelp)]
  Ctx --> Topic[HELP_TOPICS\nregistry lookup]
  Topic --> Keys[i18n keys\nhelp:*]
  Keys --> I18N[i18next]
  I18N --> Text[Localized title/body]
```

---

[Back to top](#top)
