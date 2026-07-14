# §5.6 Home Domain

The public landing page under `frontend/src/pages/home/`, rendered in the public
shell, free of authenticated chrome and of any data query before a session exists.
It is the product's front door: a value proposition, a product screenshot, a
capability grid, three orientation steps, an engineering callout linking the arc42
documentation and the repository, and a closing call to action.

`Home.tsx` is an orchestrator, not a page body. It owns only the three routing
states — spinner while auth hydrates, `<Navigate replace>` to `/dashboard` when a
session already exists, and the landing page otherwise — plus the two entry actions
(Google sign-in and demo mode, both via `useAuth()`, the same actions the login page
uses). All presentation is delegated to five section components under
`pages/home/sections/`: `HeroSection`, `FeatureGrid`, `HowItWorks`,
`EngineeringCallout`, `FinalCta`. The split exists so that the orchestrator stays
inside the page size budget as marketing copy grows, and so each section can be
tested in isolation.

Copy lives in its own `landing` i18n namespace (EN and DE); the orchestrator holds
no strings. The hero screenshot is a static asset resolved from `BASE_URL` with an
`onError` fallback to a localized caption, so a missing or blocked image degrades to
text rather than a broken frame.

Keeping the root route free of authenticated data queries preserves a fast
unauthenticated first paint and a clean public/authenticated shell split
([ADR-0005](../09-decisions/adr-0005-shell-split-authenticated-vs-public.md)).
