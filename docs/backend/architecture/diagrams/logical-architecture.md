# Logical Architecture

**Status**: Complete | **Last Updated**: 2025-11-20 | **Version**: 1.0.0

## Navigation

**Back to**: [Diagrams Index](./index.md) | [Architecture Index](../index.md)

---

## Overview

The logical architecture diagram shows how the Smart Supply Pro backend is organized into layers, each with specific responsibilities and dependencies.

---

## Layered Architecture Diagram

```mermaid
graph TB
    Client["🌐 Client Applications<br/>(Browser, Mobile, etc.)"]
    
    subgraph API["API & Controller Layer"]
        Auth["🔐 Authentication<br/>Filter"]
        Controller["📋 Controllers<br/>(SupplierController,<br/>InventoryController,<br/>AnalyticsController)"]
        DTOIn["📨 Request DTOs<br/>(CreateSupplierDTO,<br/>UpdateItemDTO)"]
    end
    
    subgraph Business["Service & Business Logic Layer"]
        Service["⚙️ Services<br/>(SupplierService,<br/>InventoryItemService,<br/>AnalyticsService)"]
        Validation["✓ Validation<br/>(Business Rules,<br/>Uniqueness Checks)"]
        Exception["⚠️ Exception Handling<br/>(GlobalExceptionHandler,<br/>BusinessExceptionHandler)"]
    end
    
    subgraph Data["Repository & Data Access Layer"]
        Repository["📦 Repositories<br/>(SupplierRepository,<br/>InventoryItemRepository,<br/>StockHistoryRepository)"]
        Query["🔍 Custom Queries<br/>(JPQL, Native SQL)"]
    end
    
    subgraph Domain["Domain Model Layer"]
        Entity["🏗️ JPA Entities<br/>(Supplier, InventoryItem,<br/>StockHistory, AppUser)"]
        Enum["📚 Enums<br/>(Role, StockChangeReason,<br/>AuditSeverity)"]
    end
    
    subgraph Infrastructure["Infrastructure & Cross-Cutting"]
        Security["🔒 Security Context<br/>(Spring Security,<br/>OAuth2)"]
        Audit["📝 Auditing<br/>(createdBy, createdAt,<br/>updatedAt, version)")
        Logging["📊 Logging<br/>(SLF4J, Logback)")
        Correlation["🔗 Correlation ID<br/>(Request Tracking)")
    end
    
    Database[("💾 Oracle<br/>Autonomous DB")]
    Cache["⚡ Cache<br/>(Redis)"]
    
    Client -->|HTTP REST| Auth
    Auth -->|Authenticated| Controller
    Controller -->|"Validate &<br/>Bind"| DTOIn
    DTOIn -->|Request| Service
    Service -->|"Apply Rules"| Validation
    Validation -->|Valid| Service
    Validation -->|Invalid| Exception
    Exception -->|Error Response| Controller
    Service -->|Read/Write| Repository
    Repository -->|Custom Queries| Query
    Repository -->|CRUD Ops| Entity
    Entity -->|Contains| Enum
    Service -.->|Use Context| Security
    Service -.->|Log Changes| Audit
    Service -.->|Log Events| Logging
    Service -.->|Track Request| Correlation
    Repository -->|SQL| Database
    Repository -->|Cache| Cache
    
    Controller -->|Response DTOs| Client
    
    style Client fill:#e1f5ff
    style API fill:#b3e5fc
    style Auth fill:#0277bd
    style Business fill:#e8f5e9
    style Data fill:#fff3e0
    style Domain fill:#fce4ec
    style Infrastructure fill:#f3e5f5
    style Database fill:#1b5e20
    style Cache fill:#ffb300
```

---

## Layer Descriptions

### 1. **Client Layer**
- External HTTP clients (browsers, mobile apps, API clients)
- Sends HTTP requests to REST endpoints
- Receives JSON responses from backend

### 2. **API & Controller Layer**
- **Controllers**: Handle HTTP requests/responses (SupplierController, InventoryController, AnalyticsController)
- **Authentication Filter**: Validates OAuth2 tokens and establishes user context
- **Request DTOs**: Data Transfer Objects for incoming requests with validation constraints
- **Response DTOs**: Data Transfer Objects for API responses
- Responsibility: Route requests, validate input format, return HTTP responses

### 3. **Service & Business Logic Layer**
- **Services**: Core business logic (SupplierService, InventoryItemService, AnalyticsService)
- **Validation Layer**: Complex business rule validation beyond DTO constraints
- **Exception Handling**: GlobalExceptionHandler and BusinessExceptionHandler
- Responsibility: Apply business rules, orchestrate operations, handle transactions, translate exceptions

### 4. **Repository & Data Access Layer**
- **Repositories**: Abstract database access (Spring Data JPA repositories)
- **Custom Queries**: Complex JPQL and native SQL for aggregations and analytics
- Responsibility: Query data, save/update/delete entities, provide pagination support

### 5. **Domain Model Layer**
- **JPA Entities**: Domain objects (Supplier, InventoryItem, StockHistory, AppUser)
- **Enums**: Type-safe enumerations (Role, StockChangeReason, AuditSeverity)
- Responsibility: Represent domain concepts, store business data

### 6. **Infrastructure & Cross-Cutting**
- **Security Context**: Spring Security, OAuth2 authentication, authorization checking
- **Auditing**: Track who made changes (createdBy, updatedAt, version fields)
- **Logging**: SLF4J + Logback for application logging
- **Correlation ID**: Unique request tracking across all layers
- **Caching**: Redis for performance optimization
- Responsibility: Provide non-functional requirements (security, logging, caching)

---

## Request Flow Through Layers

**Typical Happy Path:**
1. HTTP request arrives at Controller
2. Authentication filter validates user
3. Controller deserializes JSON to Request DTO
4. Controller calls Service method
5. Service applies business logic
6. Service calls Validator for business rules
7. Validator confirms all rules are met
8. Service calls Repository to persist data
9. Repository uses Entity objects and ORM
10. ORM generates SQL and sends to database
11. Database confirms transaction
12. Service returns result to Controller
13. Controller serializes Response DTO to JSON
14. HTTP response sent to client

**Error Path:**
1. Service detects validation error
2. Service throws domain exception (e.g., InvalidRequestException)
3. Exception handler catches exception
4. Handler maps to HTTP status code (400, 409, etc.)
5. Handler builds ErrorResponse with correlation ID
6. HTTP response with error sent to client

---

## Key Design Principles

**Separation of Concerns**: Each layer has distinct responsibilities
- Controllers: HTTP/REST
- Services: Business logic
- Repositories: Data access
- Entities: Domain model
- Infrastructure: Cross-cutting features

**Dependency Flow**: Upper layers depend on lower layers
- Controllers depend on Services
- Services depend on Repositories
- Repositories depend on Entities
- Infrastructure is injected where needed

**Abstraction**: Lower layers are abstractions that upper layers use
- Repository interface hides SQL details
- Service interface hides business logic complexity
- Entity objects hide schema details

---

## Related Documentation

- [Context Diagram](./context-diagram.md) - System-level view
- [Request Lifecycle](./request-lifecycle.md) - End-to-end request flow
- [Database ER Diagram](./database-er-diagram.md) - Domain model structure
- [Layers Architecture](../layers/overview.md) - Detailed layer documentation
- [Architecture Overview](../overview.md) - Complete architecture guide
