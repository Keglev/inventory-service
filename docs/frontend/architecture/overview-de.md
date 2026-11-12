# Frontend-Architektur

Das Frontend von Smart Supply Pro ist eine React-+-TypeScript-Single-Page-Anwendung
für Bestandsverwaltung, Lieferanten-Workflows und Einkaufsanalysen. Die Architektur
priorisiert eine **vorhersehbare Domänenstruktur**, **typisierten Datenzugriff**
und ein **zweisprachiges Nutzererlebnis mit Deutsch als Erstsprache**.

> **Dies ist eine einseitige Zusammenfassung.** Die strukturierte arc42-Dokumentation —
> Einführung und Ziele, Randbedingungen, Kontext, Bausteine, Laufzeit, Verteilung,
> Konzepte, Entscheidungen, Qualität, Risiken und Glossar — finden Sie in der
> [vollständigen Architekturdokumentation](index.html).

## Technologie-Stack

| Komponente     | Technologie                   | Version |
|----------------|-------------------------------|---------|
| Framework      | React                         | 19      |
| Sprache        | TypeScript                    | 6       |
| Build-Tool     | Vite                          | 8       |
| UI-Bibliothek  | MUI (Material UI) + X Data Grid | 9 / 9 |
| Server-State   | TanStack React Query          | 5       |
| Routing        | React Router                  | 7       |
| Forms          | React Hook Form + Zod         | 7 / 4   |
| i18n           | i18next + react-i18next       | 26 / 17 |
| Diagramme      | Recharts                      | 3       |
| HTTP-Client    | Axios                         | 1       |
| Tests          | Vitest + Testing Library; Playwright | 5 / 16; 1 |
| Laufzeit       | Node                          | >= 24   |

## Zentrale Architekturprinzipien

1. **Feature-First-Struktur** — ein eigenständiges Modul pro Geschäftsdomäne unter `src/pages/`
2. **Strikte Importrichtung** — Pages berühren keine HTTP-Details; die API-Schicht importiert keine UI
3. **Ein HTTP-Client** — eine einzige Axios-Instanz verantwortet Credentials, Header, Timeouts und die zentrale 401-Behandlung
4. **Server-State über React Query** — Caching, Retries und Invalidierung liegen in Query-Hooks, nicht in Komponenten
5. **Context für globalen Client-State** — Auth, Settings, Toast und Hilfe, Zugriff über Hooks, die außerhalb ihres Providers werfen
6. **German-First-i18n** — localStorage wird beim Erstbesuch mit `de` vorbelegt; keine Fallback-Strings im Code
7. **Dialoggetriebene Mutationen** — Create-/Edit-/Delete-Flows sind isolierte Dialog-Container je Domäne
8. **Testbarkeit** — Vitest-Suiten über Unit-, Komponenten- und Routing-Contract-Ebenen, dazu eine Playwright-Suite in der CI; Abdeckungsschwellen sichern jeden Build ab ([Bericht](https://keglev.github.io/inventory-service/frontend/coverage/index.html))

## Systemarchitektur

```mermaid
flowchart TB
  User["Browser"]:::controller
  Shell["App-Shells (öffentlich / authentifiziert)"]:::controller
  Pages["Domänen-Pages (Inventory, Suppliers, Analytics, Dashboard, Auth, Home)"]:::service
  State["Contexts (Auth, Settings, Toast, Hilfe)"]:::service
  Query["React-Query-Hooks"]:::service
  API["Domänen-Fetcher + httpClient (Axios)"]:::repository
  Backend["Spring-Boot-Backend (Hetzner)"]:::repository

  User --> Shell
  Shell --> Pages
  Pages --> State
  Pages --> Query
  Query --> API
  API -->|"Same-Origin /api/* (Nginx-Reverse-Proxy)"| Backend

  classDef controller fill:#2563eb,color:#fff,stroke:#1d4ed8;
  classDef service    fill:#0d9488,color:#fff,stroke:#0f766e;
  classDef repository fill:#d97706,color:#fff,stroke:#b45309;
```

## Domänen

Jeder Geschäftsbereich ist ein eigenständiges Modul mit derselben Orchestrator-Form:
eine Board-Komponente komponiert State-Hooks, Handler-Hooks, Query-Hooks,
Präsentationskomponenten und Dialog-Container.

| Domäne | Verantwortung |
|---|---|
| Inventory | Artikel-CRUD, Mengenanpassung, Preisänderungen, Bestandsgründe |
| Suppliers | Lieferanten-CRUD, Suche per Eingabe, seitenweise Liste; Löschen abgelehnt, solange ein Artikel auf den Lieferanten verweist |
| Analytics | Chart-/Tabellenblöcke, Filter mit URL-Sync; ein leerer Lieferantenfilter bedeutet alle Lieferanten |
| Dashboard | KPI-Karten, Bewegungs-Mini-Chart, Navigationszentrale |
| Auth | Login, OAuth-Callback + Session-Hydration, Demo-Einstieg, Logout |
| Home | Öffentlicher Landing-Flow und Demo-Einstiegspunkt |

## Authentifizierung und Session-Modell

Sessionbasiertes OAuth2 (Google), vollständig im Backend — die SPA hält keine
Tokens. Der Auth-Context hydratisiert über `GET /api/me`. Der **Demo-Modus** ist eine
clientseitige Session (in localStorage) ohne Backend-Konto: Seine Lesezugriffe erreichen
das Backend anonym und werden über `app.demo-readonly` zugelassen, und jeder Dialog
stoppt einen Schreibzugriff vor der Anfrage ([ADR-0013](09-decisions/adr-0013-demo-mode-blocks-only-the-write.md)). Unautorisierte Antworten behandelt der Axios-Interceptor
zentral, mit drei Ausnahmen (öffentliche Seiten, der `/api/me`-Probe-Aufruf,
Demo-Sessions).

## Internationalisierung

Vollständige Lokalisierung Englisch/Deutsch mit zur Laufzeit geladenen JSON-Namespaces,
zur Compile-Zeit typisierten Schlüsseln (`resources.d.ts`, aus der englischen JSON) und
ohne Fallback-Strings im Code; jeder Schlüssel existiert in beiden Sprachdateien. Der
Erstbesuch rendert bewusst auf Deutsch, und ein zur Laufzeit fehlender Schlüssel fällt
auf Deutsch zurück.

## Deployment

Der Produktions-Build wird von **Nginx auf Koyeb** ausgeliefert. Der Browser-Traffic
ist **Same-Origin**: Nginx schreibt die eingebrannte API-Basis zur Auslieferungszeit
auf den Frontend-Host um und reverse-proxyt `/api/*` sowie die OAuth-Pfade zum
Backend auf `api.smartsupplypro.de` (kanonische Aufzeichnung: Backend-ADR-0008).

```
Merge nach main
  → frontend-ci.yml       Audit, Lint, Vitest-Suite, Playwright-Suite; Image-Build,
                          SBOM- und CVE-Prüfung, Push nach Docker Hub
  → frontend-deploy.yml   dieses Image per Digest auf Koyeb ausrollen, prüfen, dass das
                          ausgelieferte Bundle den Commit trägt
```

## Tests

- **Unit-Tests** — Hooks, Utilities, API-Fetcher und Client-Policies
- **Komponententests** — Testing-Library-Rendering mit i18n- und Provider-Harness
- **Routing-Contract-Tests** — Guard-Verhalten, Redirects und Routenoberfläche

Abdeckung und Taxonomie-Konventionen sind dokumentiert in
[§8c Testing Concepts](08c-concepts-testing.md) und
[ADR-0008](09-decisions/adr-0008-testing-structure-and-taxonomy.md).
