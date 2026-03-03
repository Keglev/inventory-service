<a id="top"></a>

[⬅️ Back to Diagrams Index](../index.md)

- [Back to Architecture Index](../../index.md)
- [Back to Overview (English)](../../overview.md)
- [Zurück zum Überblick (Deutsch)](../../overview-de.md)
- [Back to Routing](../../routing/index.md)

# Routing flow

This diagram captures the main navigation decisions: public vs authenticated routes, auth bootstrap, and fallback handling.

```mermaid
flowchart TD
  Start([URL entered / navigation]) --> Match{Route matches?}

  Match -- no --> NotFound[NotFoundPage\n(route "*")]
  NotFound --> Next{User authenticated?}
  Next -- yes --> GoDash[Go to /dashboard]
  Next -- no --> GoLogin[Go to /login]

  Match -- yes --> PublicOrAuth{Public route?}
  PublicOrAuth -- yes --> Public[Render public page\n(/, /login, /auth, /logout...)]
  PublicOrAuth -- no --> Guard{RequireAuth\nallows?}

  Guard -- no --> GoLogin
  Guard -- yes --> Authed[Render AppShell + page\n(/dashboard, /inventory, ...)]

  %% cross-cutting
  Authed --> API[API calls]
  API --> Unauthorized{401?}
  Unauthorized -- yes --> LoginRedirect[httpClient redirect to /login\n(exceptions apply)]
  Unauthorized -- no --> Authed
```

Notes:
- Exact route tree and guard details are documented under Routing.
- Unauthorized redirects are centralized in the HTTP client interceptor (see Data Access diagrams).

---

[Back to top](#top)
