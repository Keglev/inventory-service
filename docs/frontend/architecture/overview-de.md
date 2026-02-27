[⬅️ Zurück zum Architektur-Index](./index.md)

# Frontend-Architektur-Überblick

## Einführung

Das Frontend von Smart Supply Pro ist eine React-basierte Single-Page-Application (SPA), die die Benutzeroberfläche für Bestandsverwaltung, Lieferanten-Workflows und Analytics bereitstellt. Die Architekturdokumentation legt den Fokus auf **Klarheit**, **Konsistenz** und **Wartbarkeit** und beschreibt, wie die Anwendung in Themen (Routing, State, Data Access, UI usw.) gegliedert ist und wie diese Themen zusammenspielen.

> Für Diagramme und visuelle Referenzen starten Sie bei **[Architektur-Diagramme](./diagrams/)**.

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
- den **Diagramm-Einstiegspunkt** (zentral unter `./diagrams/`).

### App Shell
- Docs: [App Shell](./app-shell/index.md)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: Einstiegspunkt für Shell-Varianten (öffentlich vs. authentifiziert), Layout-Komposition, Preferences (Theme/Locale), Toasts, Settings-Einstiegspunkte und Help-Integration

### Routing
- Docs: [Routing](./routing/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

### State
- Docs: [State](./state/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

### Datenzugriff (Data Access)
- Docs: [Data Access](./data-access/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

### Domänen
- Docs: [Domains](./domains/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

### UI-Komponenten
- Docs: [UI Components](./ui/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

### Theming
- Docs: [Theming](./theming/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

### Internationalisierung (i18n)
- Docs: [i18n](./i18n/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

### Performance
- Docs: [Performance](./performance/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

### Testing
- Docs: [Testing](./testing/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

### Architectural Decision Records (ADRs)
- Docs: [ADRs](./adr/)
- Diagramme: [Architektur-Diagramme](./diagrams/)
- Beschreibung: wird implementiert

## Nächste Schritte

1. Lesen Sie das Thema, das zu Ihrer aktuellen Aufgabe passt (Routing/State/Data Access/UI).
2. Nutzen Sie [Architektur-Diagramme](./diagrams/) als zentralen Einstiegspunkt für Visualisierungen.
3. Aktualisieren Sie die Kurzbeschreibung je Thema, während die Dokumentation wächst.

---

[⬅️ Zurück zum Architektur-Index](./index.md)
