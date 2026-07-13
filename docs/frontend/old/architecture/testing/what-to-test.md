<a id="top"></a>

[⬅️ Back to Testing Index](./index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# What to Test (Practical Checklist)

Use this as a lightweight checklist when adding or changing a feature.

## For a new feature / workflow

- Unit-level:
  - formatters/parsers/normalizers (edge cases + failures)
  - query key builders and “enabled” gating rules

- Hook-level:
  - hook outputs and state transitions
  - error mapping / fallback values

- Component-level (RTL):
  - rendering contracts using role/name queries
  - controlled input wiring (value + onChange)
  - disabled and loading states

- Contract/integration boundary:
  - dialog orchestration: open/close + mutation wiring
  - route behavior and redirect rules (if routing changes)

- Error cases:
  - API failure → user-friendly message and safe UI fallback
  - empty results, null/undefined inputs, missing optional fields

## Anti-patterns

Avoid:
- flaky tests that depend on real time or async race conditions
- over-mocking (mocking the unit under test instead of its boundaries)
- testing implementation details (internal state shape, private helpers)
- snapshot tests for dynamic UI (unless very stable and intentional)

## Tips

- Prefer asserting **observable behavior**:
  - what is rendered
  - which callbacks are called with which arguments
  - what navigation is triggered
- Keep i18n deterministic in tests by mocking `react-i18next` and using fallback strings.

---

[Back to top](#top)
