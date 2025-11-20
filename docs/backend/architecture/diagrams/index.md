# Architectural Diagrams Hub

**Status**: Complete | **Last Updated**: 2025-11-20 | **Version**: 1.0.0

## Navigation

**Back to**: [Architecture Index](../index.md) | [Overview](../overview.md) | [Overview (German)](../overview-de.md)

---

## Overview

All main architectural diagrams for Smart Supply Pro live here. These diagrams provide visual representations of the system's structure, flows, and interactions at different levels of abstraction.

Each diagram includes:
- Visual representation (Mermaid diagram)
- Short explanation of key components and relationships
- Links to related documentation
- Context about when and how to use the diagram

---

## Diagram Library

### 1. [Context Diagram](./context-diagram.md)

**Purpose**: System-level view showing Smart Supply Pro in its environment

**Shows**:
- Frontend (React SPA)
- Backend (Spring Boot API)
- Oracle Autonomous Database
- OAuth2 Provider (Google)
- External actors (Admin/User)

**Use When**: You need to understand the overall system boundaries and external interactions

---

### 2. [Logical Architecture](./logical-architecture.md)

**Purpose**: Layered architecture showing the internal structure of the backend

**Shows**:
- Client/API layer
- Controller layer
- Service layer
- Validation layer
- Repository layer
- Domain model layer
- Infrastructure / Cross-cutting concerns

**Use When**: You need to understand how the backend is organized internally or when explaining request handling flow

---

### 3. [Deployment Diagram](./deployment-diagram.md)

**Purpose**: Infrastructure and deployment topology

**Shows**:
- Developer workstation → GitHub repository
- GitHub Actions CI/CD pipeline
- Docker image building
- Fly.io cloud deployment (regions, machines, scaling)
- Oracle Autonomous Database connection
- Nginx reverse proxy
- TLS/HTTPS termination

**Use When**: You're deploying the application, scaling infrastructure, or understanding production topology

---

### 4. [Request Lifecycle](./request-lifecycle.md)

**Purpose**: End-to-end flow of a single HTTP request through the system

**Shows**:
- Happy path: Browser → Controller → Service → Validator → Repository → Database → Response
- Error path: Exception handling → GlobalExceptionHandler → ErrorResponse
- Correlation ID tracking throughout the request

**Use When**: You're debugging request handling, understanding request flow, or implementing request-scoped features

---

### 5. [Database ER Diagram](./database-er-diagram.md)

**Purpose**: Entity-relationship diagram for the domain model

**Shows**:
- SUPPLIER entity (supplier information, contact details)
- INVENTORY_ITEM entity (product/item details)
- STOCK_HISTORY entity (audit trail of stock movements)
- APP_USER entity (authentication and user information)
- Relationships between entities
- Audit fields (createdAt, updatedAt, createdBy)
- Version fields (optimistic locking)

**Use When**: You're designing database queries, understanding relationships, or working with the persistence layer

---

### 6. [Security Flow](./security-flow.md)

**Purpose**: OAuth2 authentication and authorization flows

**Shows**:
- OAuth2 authorization code flow (user login via Google)
- Token validation and user context establishment
- Authorization checking (@PreAuthorize)
- Exception handling for authentication/authorization failures
- Correlation ID tracking in security operations

**Use When**: You're implementing authentication, understanding authorization, or debugging security issues

---

### 7. [Analytics Flow](./analytics-flow.md)

**Purpose**: Data flow for analytics operations

**Shows**:
- Stock history repository (source of analytics data)
- Inventory item repository (product information)
- AnalyticsService (computation and aggregation)
- DTOs (data transfer to frontend)
- AnalyticsController (REST endpoints)
- Frontend charts and dashboards

**Includes**:
- Daily analytics calculation flow
- Window-based analytics calculations
- Cost analysis (WAC, FIFO) calculations

**Use When**: You're working on analytics features, understanding data aggregation, or building reporting functionality

---

## Diagram Reference Quick Card

| Diagram | Focus | Use For |
|---------|-------|---------|
| [Context](./context-diagram.md) | System boundaries | Understanding overall system |
| [Logical Architecture](./logical-architecture.md) | Layered structure | Internal organization |
| [Deployment](./deployment-diagram.md) | Infrastructure | Operations & scaling |
| [Request Lifecycle](./request-lifecycle.md) | Request flow | Debugging & features |
| [Database ER](./database-er-diagram.md) | Data model | Persistence & queries |
| [Security Flow](./security-flow.md) | Auth/Authz | Security features |
| [Analytics Flow](./analytics-flow.md) | Data aggregation | Analytics features |

---

## Diagram Reuse Pattern

**To keep documentation maintainable**, each diagram has a single source:

1. **For the complete view**: Link to the dedicated diagram file
2. **For embedding**: Reference other documentation to the diagram page with a link like:
   > "For the full system-level view, see the [Context Diagram](./context-diagram.md)."
3. **Cross-references**: Related documentation files link back to diagrams rather than duplicating them

**Examples:**
- [Architecture Overview](../overview.md) references the Context and Request Lifecycle diagrams
- [Deployment Index](../deployment/index.md) links to the Deployment Diagram
- [Security Architecture](../security/index.md) references the Security Flow diagram
- [Repository Documentation](../repository/index.md) links to the Database ER Diagram

---

## Integration Points

### Architecture Index
[/architecture/index.md](../index.md) → Links to diagrams/index.md

### Overview Documents
- [English Overview](../overview.md) → References Context, Request Lifecycle, and Deployment diagrams
- [German Overview](../overview-de.md) → References same diagrams with German labels

### Specific Architecture Sections
- **Layers Documentation**: Links to Logical Architecture diagram
- **Deployment Documentation**: Links to Deployment diagram
- **Security Documentation**: Links to Security Flow diagram
- **Repository/Model Documentation**: Links to Database ER diagram
- **Analytics Documentation**: Links to Analytics Flow diagram

---

## Best Practices for Diagram Use

1. **Start with Context Diagram** - Get the "30,000 ft view" first
2. **Understand Logical Architecture** - Learn how the backend is organized
3. **Study Request Lifecycle** - See how requests actually flow through layers
4. **Reference others as needed** - Deployment, Database, Security, Analytics based on your role

5. **Link, don't duplicate** - If a diagram exists here, link to it from other docs

6. **Keep diagrams updated** - When architecture changes, update these diagrams first, then update related documentation to reference them

---

## Next Steps

1. **Review [Context Diagram](./context-diagram.md)** - Start with the system-level view
2. **Study [Logical Architecture](./logical-architecture.md)** - Understand internal layering
3. **Follow [Request Lifecycle](./request-lifecycle.md)** - See how requests flow through the system
4. **Explore specific diagrams** based on your focus (Deployment, Database, Security, Analytics)
5. **Return to [Architecture Index](../index.md)** for deeper documentation on each area

---

**Related Documentation:**
- [Architecture Index](../index.md)
- [Architecture Overview (English)](../overview.md)
- [Architecture Overview (German)](../overview-de.md)
- [Layers Architecture](../layers/overview.md)
- [Deployment Architecture](../deployment/index.md)
- [Security Architecture](../security/index.md)
