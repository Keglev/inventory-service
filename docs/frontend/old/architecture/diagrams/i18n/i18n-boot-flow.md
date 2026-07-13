<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to i18n](../../i18n/index.md)

# i18n boot flow (German-first)

The i18n layer initializes once and loads JSON namespaces dynamically.

```mermaid
flowchart TD
  Boot[import './i18n'] --> Saved{localStorage\n'i18nextLng' exists?}
  Saved -- yes --> Lng[use saved lng]
  Saved -- no --> SetDe[set i18nextLng = 'de']
  SetDe --> Lng

  Lng --> Init[i18n.init()]
  Init --> Detect[detector order\nlocalStorage → querystring → navigator]
  Init --> Backend[i18next-http-backend]\n
  Backend --> Load[/public/locales/{lng}/{ns}.json]
  Load --> Ready[Namespaces available\nuseTranslation() can render]
```

---

[Back to top](#top)
