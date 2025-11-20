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
- **[Integration Architecture](./integration/index.html)** - Frontend-backend integration, API contracts, authentication flows, error handling, CORS configuration, and testing strategies
- **[Repository Layer](./repository/index.html)** - Data access abstraction with 7 repositories (JpaRepository, custom analytics mixins, JPQL, native SQL)
- **[Security Architecture](./security/index.html)** - Authentication, authorization, OAuth2 integration, Docker security, and demo mode
- **[Deployment & Infrastructure](./deployment/index.html)** - Complete deployment pipeline from source to Fly.io, CI/CD automation, Docker image building, and operational procedures
- **[Resources & Configuration](./resources/index.html)** - Spring Boot config files, profiles, logging, database configuration, Oracle Wallet integration
- **[Data Models & Entities](./model/index.html)** - Comprehensive entity documentation including Supplier, InventoryItem, StockHistory, and AppUser with relationships, lifecycle, usage examples, and testing
- **[Enums Reference](./enums/index.html)** - Type-safe enumerations (Role, StockChangeReason, AuditSeverity) with business logic and validation
- **[DTOs & Data Transfer Objects](./dto/index.html)** - Comprehensive DTO documentation with conventions, patterns, validation, authentication, pagination, and response shapes
- **[Exceptions & Error Handling](./exceptions.html)** - Exception hierarchy and error response patterns
- **[Validation Framework](./validation/index.html)** - Multi-layer validation with JSR-380, custom validators, exception handling, and patterns
- **[Testing Strategy](./testing/index.html)** - Unit testing, integration testing, security testing, and test patterns

## Quick Navigation

### By Audience

**Developers implementing features:**
1. Start with [High-level Overview](./overview.html)
2. Review [Integration Architecture](./integration/index.html) to understand frontend-backend communication
3. Review [Layers Architecture](./layers/overview.html)
4. Explore relevant layer documentation (e.g., [Data Models](./model/index.html), [Enums](./enums/index.html), [DTOs](./dto/index.html))
5. Check [Validation Framework](./validation.html) for input handling
6. Review [Testing Strategy](./testing.html) for test patterns

**Frontend developers:**
1. Start with [Integration Architecture](./integration/index.html)
2. Review [API Contract & Endpoints](./integration/api-contract-and-endpoints.html)
3. Study [Error Handling Contract](./integration/error-handling-contract.html)
4. Check [Authentication Flow](./integration/auth-flow-frontend.html)
5. Review [CORS & Network](./integration/cors-and-network.html)
6. Setup [Environments & URLs](./integration/environments-and-urls.html)

**DevOps / Infrastructure teams:**
1. Review [Deployment & Infrastructure](./deployment.html)
2. Check [Resources & Configuration](./resources/index.html) for environment setup
3. Review [Security Architecture](./security.html) for OAuth2 and security configuration
4. Study [Integration Architecture](./integration/index.html) for network/CORS configuration

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
