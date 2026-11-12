# §1 Einführung & Ziele

> Einseitige Zusammenfassung: [Architektur-Überblick](overview-de.md)

Das Frontend von Smart Supply Pro ist eine React-+-TypeScript-Single-Page-Anwendung
für Bestandsverwaltung, Lieferanten-Workflows und Einkaufsanalysen. Diese
Dokumentation folgt der arc42-Struktur, die bereits für die
[Backend-Architekturdokumentation](../../backend/architecture/index.md) verwendet
wird — beide Systemhälften sind damit gleich aufgebaut und gleich lesbar.

## Zweck

Reviewer und Mitwirkende erhalten ein vollständiges Bild der SPA: Randbedingungen,
Kontext, Bausteine, Laufzeitverhalten und die dokumentierte Begründung jeder
wesentlichen Architekturentscheidung.

## Qualitätsziele

| Priorität | Ziel | Bedeutung im Projekt |
|---|---|---|
| 1 | Korrektheit | Der UI-Zustand spiegelt stets den Serverzustand; Mutationen invalidieren die richtigen Query-Caches |
| 2 | Wartbarkeit | Feature-first-Schichtung (ADR-0001); strikte Größen- und Kommentarstandards; typisierte i18n-Schlüssel |
| 3 | Testbarkeit | Jede Schicht isoliert testbar; die Testsuite läuft bei jedem CI-Build und schlägt unterhalb der Abdeckungsschwellen in `vitest.config.ts` fehl ([Frontend-Abdeckungsbericht](https://keglev.github.io/inventory-service/frontend/coverage/index.html)) |
| 4 | Zweisprachige UX | Vollständige EN/DE-Lokalisierung ohne Fallback-Strings im Code |

## Kapitel

Die Kapitel selbst sind auf Englisch dokumentiert.

| Kapitel | Inhalt | Status |
|---|---|---|
| §1 Einführung & Ziele | Diese Seite | Aktuell |
| [§2 Randbedingungen](02-constraints.md) | Technologie, organisatorische Randbedingungen, Konventionen | Aktuell |
| [§3 Kontext & Abgrenzung](03-context.md) | Systemgrenze, externe Systeme, Integrationsfakten | Aktuell |
| [§4 Lösungsstrategie](04-solution-strategy.md) | Zentrale Architekturansätze im Überblick | Aktuell |
| [§5 Bausteine](05-building-blocks.md) | App-Shell, Domänenseiten, API-Schicht, gemeinsame UI | Aktuell |
| [§6 Laufzeit](06-runtime.md) | Routing, Guards, zentrale Benutzerabläufe | Aktuell |
| [§7 Verteilung](07-deployment.md) | Build, Auslieferung über Koyeb/Nginx, Frontend-CI | Aktuell |
| [§8 Konzepte](08-concepts.md) | Zustand und Datenzugriff | Aktuell |
| [§8b Konzepte](08b-concepts-i18n-theming.md) | Internationalisierung und Theming | Aktuell |
| [§8c Konzepte](08c-concepts-testing.md) | Teststrategie und Konventionen | Aktuell |
| [§9 Entscheidungen (ADRs)](09-decisions/index.md) | Architekturentscheidungen | Aktuell |
| [§10 Qualitätsanforderungen](10-quality-requirements.md) | Durchgesetzte Qualitätsszenarien und Nicht-Ziele | Aktuell |
| [§11 Risiken & technische Schulden](11-risks-technical-debt.md) | Bekannte Risiken und technische Schulden | Aktuell |
| [§12 Glossar](12-glossary.md) | Fach- und Technikbegriffe | Aktuell |
