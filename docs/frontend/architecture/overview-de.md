[⬅️ Zurück zum Architektur-Index](./index.md)

# Frontend-Architektur-Überblick

## Einführung

Das Frontend von Smart Supply Pro ist eine React-basierte Single-Page-Application (SPA), die die Benutzeroberfläche für Bestandsverwaltung, Lieferanten-Workflows und Analytics bereitstellt. Die Architekturdokumentation legt den Fokus auf **Klarheit**, **Konsistenz** und **Wartbarkeit** und beschreibt, wie die Anwendung in Themen (Routing, State, Data Access, UI usw.) gegliedert ist und wie diese Themen zusammenspielen.

> Für Diagramme und visuelle Referenzen starten Sie bei **[Architektur-Diagramme](./diagrams/index.md)**.

## Systemkontext (High-Level)

```mermaid
graph LR
    User["Benutzer"] --> Browser["Browser"]
    Browser --> SPA["Frontend SPA (React)"]
    SPA --> API["Backend API"]
    API --> DB["Datenbank"]
```

## Umfang der Dokumentation

Dieser Überblick vermeidet bewusst Implementierungsdetails. Jedes Thema unten verweist auf seinen eigenen Abschnitt, in dem Muster, Entscheidungen und Beispiele dokumentiert werden.

## Themen (und wo Diagramme zu finden sind)

Jedes Thema verlinkt auf:
- den **Themenordner** (Dokumentation), und
- den **Diagramm-Einstiegspunkt** (zentral unter `./diagrams/index.md`).

### App Shell
- Docs: [App Shell](./app-shell/index.md)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: Einstiegspunkt für Shell-Varianten (öffentlich vs. authentifiziert), Layout-Komposition, Preferences (Theme/Locale), Toasts, Settings-Einstiegspunkte und Help-Integration

### Routing
- Docs: [Routing](./routing/index.md)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: Wie URLs auf Seiten abgebildet werden, wie Routen gruppiert sind (öffentlich vs. authentifiziert), Guard/Redirect-Verhalten, Logout/Session-Expiry-Navigation und 404-Fallback

### State
- Docs: [State](./state/index.md)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: Globaler, querschnittlicher State via React Context (Auth, Settings, Toast, Help) sowie Abgrenzung zu lokalem UI-State und Server-State

### Datenzugriff (Data Access)
- Docs: [Data Access](./data-access/index.md)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: Struktur der API-Schicht (Axios-Client, domain-spezifische Fetcher/Normalizers, React-Query-Hooks), Caching-Konventionen, tolerantes Parsing und benutzerfreundliche Fehlermeldungen

### Domänen
- Docs: [Domains](./domains/index.md)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: Wie Domänen-Seiten unter src/pages/* organisiert sind (Inventory, Suppliers, Analytics usw.) und welche Verantwortlichkeiten der Page-Orchestrator vs. gemeinsame Schichten haben

### UI-Komponenten
- Docs: [UI Components](./ui/)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: wird implementiert

### Theming
- Docs: [Theming](./theming/)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: wird implementiert

### Internationalisierung (i18n)
- Docs: [i18n](./i18n/)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: wird implementiert

### Performance
- Docs: [Performance](./performance/)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: wird implementiert

### Testing
- Docs: [Testing](./testing/)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: wird implementiert

### Architectural Decision Records (ADRs)
- Docs: [ADRs](./adr/)
- Diagramme: [Architektur-Diagramme](./diagrams/index.md)
- Beschreibung: wird implementiert

## Nächste Schritte

1. Lesen Sie das Thema, das zu Ihrer aktuellen Aufgabe passt (Routing/State/Data Access/UI).
2. Nutzen Sie [Architektur-Diagramme](./diagrams/index.md) als zentralen Einstiegspunkt für Visualisierungen.
3. Aktualisieren Sie die Kurzbeschreibung je Thema, während die Dokumentation wächst.

---

[⬅️ Zurück zum Architektur-Index](./index.md)
