# Backend Architecture Index

Welcome to the Smart Supply Pro backend architecture documentation. This section provides comprehensive information about the system's design, structure, and implementation patterns.

## Overview

The Smart Supply Pro inventory management backend is built with **Spring Boot** and follows a layered architecture pattern with clear separation of concerns. The system manages supplier relationships, inventory items, stock history tracking, and advanced analytics.

## Documentation Structure

### Core Architecture
- **[High-level Overview (English)](./overview.html)** - Comprehensive English overview of the backend architecture, layers, and key components
- **[Überblick (German)](./overview-de.html)** - Deutschsprachige Zusammenfassung der Backend-Architektur

### Detailed Sections
- **[Layers Architecture](./layers/overview.html)** - Detailed breakdown of controller, service, repository, and data layers
- **[Repository Layer](./repository/index.html)** - Data access abstraction with 7 repositories (JpaRepository, custom analytics mixins, JPQL, native SQL)
- **[Security Architecture](./security.html)** - Authentication, authorization, and OAuth2 integration
- **[Deployment & Infrastructure](./deployment.html)** - Containerization, CI/CD, and cloud deployment strategies
- **[Configuration Management](./config.html)** - Application properties, profiles, and environment setup
- **[Data Models & Entities](./model/index.html)** - Comprehensive entity documentation including Supplier, InventoryItem, StockHistory, and AppUser with relationships, lifecycle, usage examples, and testing
- **[Enums Reference](./enums/index.html)** - Type-safe enumerations (Role, StockChangeReason, AuditSeverity) with business logic and validation
- **[DTOs & Data Transfer Objects](./dto/index.html)** - Comprehensive DTO documentation with conventions, patterns, validation, authentication, pagination, and response shapes
- **[Exceptions & Error Handling](./exceptions.html)** - Exception hierarchy and error response patterns
- **[Validation Framework](./validation.html)** - Input validation strategies and custom validators
- **[Testing Strategy](./testing.html)** - Unit testing, integration testing, and test patterns

## Quick Navigation

### By Audience

**Developers implementing features:**
1. Start with [High-level Overview](./overview.html)
2. Review [Layers Architecture](./layers/overview.html)
3. Explore relevant layer documentation (e.g., [Data Models](./model/index.html), [Enums](./enums/index.html), [DTOs](./dto/index.html))
4. Check [Validation Framework](./validation.html) for input handling
5. Review [Testing Strategy](./testing.html) for test patterns

**DevOps / Infrastructure teams:**
1. Review [Deployment & Infrastructure](./deployment.html)
2. Check [Configuration Management](./config.html)
3. Understand [Security Architecture](./security.html)

**Security reviewers:**
1. Start with [Security Architecture](./security.html)
2. Review [Exceptions & Error Handling](./exceptions.html)
3. Check [Validation Framework](./validation.html)

**New team members:**
1. Read [High-level Overview](./overview.html) first
2. Explore [Layers Architecture](./layers/overview.html) to understand separation of concerns
3. Review [Testing Strategy](./testing.html) to learn team conventions

## Key Architectural Principles

1. **Separation of Concerns** - Clear boundaries between controller, service, repository, and data layers
2. **Dependency Injection** - Spring framework manages all bean dependencies
3. **RESTful API Design** - Standard HTTP methods and status codes for all endpoints
4. **Security First** - OAuth2 authentication and role-based access control (RBAC)
5. **Data Validation** - Multi-layer validation from DTO to entity level
6. **Exception Handling** - Consistent error response format with appropriate HTTP status codes
7. **Testing** - Comprehensive unit and integration tests with mocking patterns
8. **Documentation** - Code comments, JavaDoc, and architectural documentation

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | Spring Boot | 2.7.x |
| **Language** | Java | 11+ |
| **Database** | Oracle DB / PostgreSQL | Latest |
| **Build Tool** | Maven | 3.x+ |
| **Testing** | JUnit 5, Mockito | Latest |
| **Security** | Spring Security, OAuth2 | 2.7.x |
| **Containerization** | Docker | Latest |

## Getting Started

1. **Clone the repository** and navigate to the root directory
2. **Review the [High-level Overview](./overview.html)** to understand the big picture
3. **Examine the [Layers Architecture](./layers/overview.html)** to learn component interactions
4. **Explore the code** in `/src/main/java/com/smartsupplypro/inventory/`
5. **Check tests** in `/src/test/java/` to understand testing patterns
6. **Deploy locally** using the [Deployment Guide](./deployment.html)

## Recent Updates

- Enhanced backend architecture documentation with comprehensive guides
- Improved test documentation with JavaDoc and inline comments
- Expanded API reference with all 45 endpoints documented
- Enhanced CI/CD pipeline with improved coverage reporting

---

*Last updated: November 2024*
