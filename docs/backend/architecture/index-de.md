# §1 Einführung und Ziele

> Einseitige Zusammenfassung: [Architektur-Überblick](overview-de.md)

## Zweck

Das Backend von Smart Supply Pro ist ein Spring-Boot-Dienst für die Verwaltung von
Lieferantenbeziehungen, die Bestandsverfolgung und Echtzeit-Lageranalysen. Es stellt
eine RESTful API bereit, die vom React-Frontend genutzt wird, basiert auf Oracle
Autonomous Database 23ai und wird über Google OAuth2 mit rollenbasierter
Zugriffskontrolle (RBAC) abgesichert.

## Qualitätsziele

| Priorität | Qualitätsziel | Szenario |
|---|---|---|
| 1 | Sicherheit | Die Anmeldung über Google OAuth2 eröffnet eine Server-Session; jeder `/api`-Endpunkt trägt eine `@PreAuthorize`-Regel, Schreibzugriffe erfordern `USER` oder `ADMIN`, Administratoroperationen `ADMIN`. Bei aktivem Demo-Modus dürfen anonyme Aufrufer lesen und erhalten maskierte Identitäten; der Health-Endpunkt ist öffentlich |
| 2 | Wartbarkeit | Jedes Konzept hat genau einen Ort — Controller routen, Services entscheiden, Repositories persistieren; die DTO-Grenze ([ADR-0003](09-decisions/adr-0003-dto-boundary-no-entity-exposure.md)) hält die Schichten auseinander, geprüft im Review |
| 3 | Trennung der Verantwortlichkeiten | DTO-Grenze an allen Controller-Grenzen; JPA-Entitäten verlassen nie die Service-Schicht; DTOs gelangen nie in Repositories |
| 4 | Testbarkeit | Konstruktorinjektion und Repository-Abstraktion ermöglichen Unit-Tests der Service-Schicht ohne laufenden Spring-Kontext oder Datenbank |
| 5 | Korrektheit | Drei-Stufen-Validierung (DTO-Annotationen, geschäftliche Regeln im Service, Datenbankconstraints) stellt sicher, dass kein ungültiger Zustand persistiert werden kann |

## Stakeholder

| Rolle | Interesse |
|---|---|
| Endbenutzer (Rolle `USER`) | Zuverlässige Bestandsansicht und grundlegende Lageroperationen; reaktionsfähige API mit aussagekräftigen Fehlermeldungen |
| Administratoren (Rolle `ADMIN`) | Vollständiges CRUD für Lieferanten und Lagerartikel; Zugang zu Analysen und Finanzzusammenfassungen |
| Entwickler | Klare Schichtgrenzen, dokumentierte Architekturentscheidungen und eine Testsuite, die Regressionen vor dem Deployment erkennt |

## Abschnitte

| Abschnitt | Thema |
|---|---|
| [§2 Randbedingungen](02-constraints.md) | Java 21, Spring Boot 4, Oracle 23ai, Maven, Docker; Einzelentwickler- und REST-Konventionen |
| [§3 Kontextabgrenzung](03-context.md) | Fachlicher und technischer Kontext, externe Systeme (React-Frontend, Oracle ADB, Google OAuth2), C4-L1-Diagramm |
| [§4 Lösungsstrategie](04-solution-strategy.md) | Wesentliche strategische Entscheidungen und die ADRs, die sie begründen |
| [§5 Bausteinsicht](05-building-blocks.md) | Schichtaufbau — Controller, Service, Repository, Modell — Logikarchitektur- und ER-Diagramme |
| [§6 Laufzeitsicht](06-runtime.md) | Anfrage-Lebenszyklus, OAuth2-Login-Flow und Analyseberechnung als Sequenzdiagramme |
| [§7 Verteilungssicht](07-deployment.md) | Hetzner-Topologie, GitHub-Actions-CI/CD-Pipeline, Docker-Image-Strategie, Umgebungsgeheimnisse |
| [§8 Querschnittliche Konzepte](08-concepts.md) | Sicherheit, Validierung, Fehlerbehandlung, Konfigurationsprofile, Persistenz-Audit-Felder (`createdBy`, `createdAt`) |
| [§9 Entscheidungen](09-decisions/index.md) | Architecture Decision Records |
| [§10 Qualitätsziele](10-quality-requirements.md) | Qualitätsbaum und messbare Qualitätsszenarien, jeweils auf die Entscheidung oder Sicht zurückgeführt, die sie umsetzt |
| [§11 Risiken und technische Schulden](11-risks-technical-debt.md) | Bekannte Risiken, benannte technische Schulden und die Ausnahmen vom Größenbudget |
| [§12 Glossar](12-glossary.md) | Fachliche und technische Begriffe |
