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
| 3 | Testbarkeit | 1.319 Tests in 225 Dateien (~86 % Zeilenabdeckung); jede Schicht isoliert testbar |
| 4 | Zweisprachige UX | Vollständige EN/DE-Lokalisierung ohne Fallback-Strings im Code |

## Kapitel

Die Kapitelübersicht mit aktuellem Status ist in der
[englischen Fassung](index.md) gepflegt; die Kapitel selbst sind auf Englisch
dokumentiert. Die Architecture Decision Records finden sich unter
[§9 Entscheidungen (ADRs)](09-decisions/index.md).
