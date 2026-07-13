# §1 Introduction & Goals

Smart Supply Pro's frontend is a React + TypeScript single-page application providing
the user experience for inventory management, supplier workflows, and purchasing
analytics. This documentation follows the arc42 structure already used by the
[backend architecture docs](../../backend/architecture/index.md), so both halves of
the system read the same way.

## Purpose

Give a reviewer or contributor a complete picture of how the SPA is built: its
constraints, context, structural building blocks, runtime behavior, and the recorded
reasoning behind every significant decision.

## Quality Goals

| Priority | Goal | Meaning here |
|---|---|---|
| 1 | Correctness | UI state always reflects server truth; mutations invalidate the right query caches |
| 2 | Maintainability | Feature-first layering (ADR-0001); strict size and comment standards; typed i18n keys |
| 3 | Testability | 1,319 tests across 225 files (~86% line coverage); every layer testable in isolation |
| 4 | Bilingual UX | Full EN/DE localization with no in-code fallback strings |

## Chapters

| Chapter | Content | Status |
|---|---|---|
| §1 Introduction & Goals | This page | Current |
| [§2 Constraints](02-constraints.md) | Technology, organizational constraints, conventions | Current |
| [§3 Context & Scope](03-context.md) | System boundary, external systems, integration facts | Current |
| [§4 Solution Strategy](04-solution-strategy.md) | Key architectural approaches at a glance | Current |
| [§5 Building Blocks](05-building-blocks.md) | App shell, domain pages, API layer, shared UI | Current |
| §6 Runtime | Routing, guards, key user flows | In restructure — see [legacy routing docs](../old/architecture/routing/index.md) |
| §7 Deployment | Koyeb/Nginx, frontend CI | In restructure — see [legacy performance docs](../old/architecture/performance/index.md) |
| §8 Concepts | State, data access, i18n, theming, testing | In restructure — see [legacy topics](../old/architecture/index.md) |
| [§9 Decisions (ADRs)](09-decisions/index.md) | Architecture decision records | Current |
| §10 Quality Requirements | Coverage gates, CI quality checks | Planned |
| §11 Risks & Technical Debt | Known risks and tracked debt | Planned |
| §12 Glossary | Domain and technical terms | Planned |

## Sprache / Language

Ein deutschsprachiger Einstieg ist verfügbar: [Einführung & Ziele (Deutsch)](index-de.md).
