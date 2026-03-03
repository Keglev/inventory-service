<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to App Shell](../../app-shell/index.md)

# App shell variants & layout

The app distinguishes between a public experience (landing/login/callback/logout) and the authenticated app shell.

```mermaid
graph LR
  Router[Router] --> Public[Public pages\n/, /login, /auth, /logout]
  Router --> Guard[RequireAuth]
  Guard --> AppShell[AppShell\n(nav + header + content)]

  AppShell --> Help[Help integration\n(HelpIconButton + provider)]
  AppShell --> Settings[Settings entry points\n(preferences/system info)]
  AppShell --> Toast[Toasts\n(user feedback)]
  AppShell --> Pages[Domain pages]
```

---

[Back to top](#top)
