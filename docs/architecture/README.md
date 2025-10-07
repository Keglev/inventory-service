# Smart Supply Pro - Architecture Documentation

**Project**: Inventory Management Service  
**Framework**: Spring Boot 3.5.6 + Java 17  
**Architecture Style**: Layered Architecture (Controller → Service → Repository)  
**Last Updated**: October 7, 2025

---

## 📚 Documentation Structure

This directory contains comprehensive enterprise-level architecture documentation for the Smart Supply Pro inventory management system.

### 🏗️ Core Architecture

- **[Security Overview](./security-overview.md)** - Authentication, authorization, OAuth2 integration
- **[Service Layer Overview](./services/README.md)** - Business logic and service patterns
- **[Design Patterns](./patterns/README.md)** - Reusable patterns and best practices
- **[Refactoring Roadmap](./refactoring/README.md)** - Technical debt and improvement plans

---

## 🔧 Service Layer

| Service | Complexity | Purpose | Documentation |
|---------|------------|---------|---------------|
| **AnalyticsServiceImpl** | 🔴 HIGH | Business insights, WAC algorithm, trend analysis | [📖 Docs](./services/analytics-service.md) |
| **InventoryItemServiceImpl** | 🟡 MEDIUM | Inventory CRUD, stock history, audit trail | [📖 Docs](./services/inventory-item-service.md) |
| **SupplierServiceImpl** | 🟢 LOW | Supplier management, referential integrity | [📖 Docs](./services/supplier-service.md) |
| **StockHistoryService** | 🟢 LOW | Append-only audit log, stock movements | [📖 Docs](./services/stock-history-service.md) |
| **CustomOAuth2UserService** | 🟡 MEDIUM | OAuth2 user authentication | [📖 Docs](./services/oauth2-services.md) |
| **CustomOidcUserService** | 🟡 MEDIUM | OIDC token handling | [📖 Docs](./services/oauth2-services.md) |

---

## 🎨 Design Patterns

| Pattern | Purpose | Files |
|---------|---------|-------|
| **Validation Delegation** | Centralized validation logic | [📖 Docs](./patterns/validation-patterns.md) |
| **Static Mapper Pattern** | DTO ↔ Entity conversion | [📖 Docs](./patterns/mapper-patterns.md) |
| **Security Context Utilities** | Authentication user retrieval | [📖 Docs](./patterns/security-context.md) |
| **Audit Trail** | Track who/when/what changes | [📖 Docs](./patterns/audit-trail.md) |
| **Repository Query Methods** | Custom JPA queries | [📖 Docs](./patterns/repository-patterns.md) |

---

## 🔄 Refactoring Roadmap

| Priority | Refactoring | Impact | Effort | Status |
|----------|-------------|--------|--------|--------|
| ⭐⭐⭐ **HIGH** | SecurityContextUtils Extraction | 3+ files | 2h | 📋 Planned |
| ⭐⭐ **MEDIUM** | ValidationCoordinator Standardization | 2 files | 4h | 📋 Planned |
| ⭐ **LOW** | AuditFieldListener (JPA) | 2-3 entities | 3h | 💡 Optional |
| ⭐ **LOW** | Caching Strategy (Master Data) | 1 file | 2h | 💡 Optional |

See [Refactoring Roadmap](./refactoring/README.md) for details.

---

## 📊 Architecture Diagrams

- **[Service Layer Overview](./diagrams/service-layer-overview.md)** - Component relationships
- **[Stock Movement Flow](./diagrams/stock-movement-flow.md)** - Sequence diagram for inventory changes
- **[OAuth2 Login Flow](./diagrams/oauth2-login-flow.md)** - Authentication sequence
- **[Analytics Calculation Flow](./diagrams/analytics-calculation-flow.md)** - WAC algorithm visualization

---

## 🔗 Related Documentation

- **[API Documentation (OpenAPI)](../openapi.yaml)** - REST API specification
- **[API Reference (Redoc)](../api.html)** - Interactive API documentation
- **[Backend Test Coverage](https://keglev.github.io/inventory-service/backend/coverage/index.html)** - JaCoCo coverage report (268 tests)
- **[Frontend Documentation](../../frontend/README.md)** - React TypeScript SPA

---

## 📖 Reading Guide

### For New Developers
1. Start with [Security Overview](./security-overview.md)
2. Read [Service Layer Overview](./services/README.md)
3. Review individual service docs based on your task
4. Check [Design Patterns](./patterns/README.md) for reusable patterns

### For Architecture Review
1. Review [Service Layer Overview](./services/README.md)
2. Check [Refactoring Roadmap](./refactoring/README.md)
3. Examine [Design Patterns](./patterns/README.md) for consistency
4. Review individual service complexity ratings

### For API Integration
1. Start with [API Documentation](../api.html)
2. Review [Security Overview](./security-overview.md) for authentication
3. Check individual controller documentation
4. Test with Swagger UI or Postman

---

## 🛠️ Documentation Standards

All architecture documents follow these standards:

### Structure
- **Overview** - Purpose and responsibilities
- **Operation Flows** - Mermaid sequence diagrams
- **Business Rules** - What, why, how, exceptions
- **Design Patterns** - Intent, implementation, trade-offs
- **API Documentation** - Links to OpenAPI/Redoc
- **Related Components** - Dependencies and relationships
- **Refactoring Notes** - Technical debt and improvements
- **Performance Considerations** - Benchmarks and optimizations

### Diagrams
- Use Mermaid for sequence diagrams, flowcharts, class diagrams
- Include alt text for accessibility
- Keep diagrams focused (one concept per diagram)

### Code Examples
- Use syntax highlighting
- Include complete, runnable examples
- Show both success and error cases
- Document expected inputs/outputs

---

## 📝 Contributing

When updating architecture documentation:

1. **Keep in sync**: Update docs when code changes
2. **Link to code**: Use relative paths to source files
3. **Version control**: Commit docs with related code changes
4. **Review process**: Architecture changes require peer review
5. **Diagrams**: Update diagrams when flows change

---

## 📧 Contact

For questions about architecture decisions:
- **Technical Lead**: [Your Name]
- **Architecture Review**: [Team Lead]
- **Documentation Issues**: [GitHub Issues](https://github.com/Keglev/inventory-service/issues)

---

**Last Review**: October 7, 2025  
**Next Review**: Quarterly (January 2026)
