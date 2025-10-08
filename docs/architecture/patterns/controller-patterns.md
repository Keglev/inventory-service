# Controller Layer Architecture Patterns

## Overview

This document describes the architectural patterns, security strategies, and REST API conventions implemented across the inventory service controller layer. These patterns ensure consistency, maintainability, and enterprise-grade quality across all REST endpoints.

## Table of Contents

1. [REST API Conventions](#rest-api-conventions)
2. [Security Patterns](#security-patterns)
3. [Validation Strategies](#validation-strategies)
4. [HTTP Status Code Standards](#http-status-code-standards)
5. [Enterprise Business Logic Patterns](#enterprise-business-logic-patterns)
6. [Error Handling Patterns](#error-handling-patterns)
7. [Performance and Pagination](#performance-and-pagination)
8. [Controller-Specific Patterns](#controller-specific-patterns)

---

## REST API Conventions

### Resource Naming
- **Plural nouns** for collections: `/api/suppliers`, `/api/inventory-items`
- **Hierarchical paths** for related resources: `/api/stock-history/item/{itemId}`
- **Kebab-case** for multi-word resources: `/api/stock-history`

### HTTP Method Mapping
```java
@GetMapping           // Read operations (list, get by ID, search)
@PostMapping          // Create new resources
@PutMapping("/{id}")  // Update existing resources
@DeleteMapping("/{id}") // Delete resources
```

### Location Header Pattern
**Enterprise Pattern**: Always provide `Location` header for created resources to enable immediate client navigation.

```java
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody SupplierDTO dto) {
    SupplierDTO created = supplierService.create(dto);
    // Enterprise Comment: REST Location header pattern - provide resource URI for immediate access
    // enabling client-side navigation and RESTful resource discovery
    return ResponseEntity.created(URI.create("/api/suppliers/" + created.getId()))
            .header(HttpHeaders.LOCATION, "/api/suppliers/" + created.getId())
            .body(created);
}
```

**Controllers implementing this pattern**: `SupplierController`, `InventoryItemController`

---

## Security Patterns

### Role-Based Authorization
The inventory service implements a comprehensive role-based access control system:

#### Authorization Levels
- **Public/Demo**: Limited read-only access for demo environments
- **USER**: Authenticated read access to most resources
- **ADMIN**: Full CRUD operations on all resources

#### Security Annotation Patterns

```java
// Demo readonly access pattern
@PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")

// Authenticated user access
@PreAuthorize("isAuthenticated()")

// Role-specific access
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasAnyRole('ADMIN','USER')")
```

### Demo Mode Security Pattern
**Enterprise Pattern**: Conditional demo access for non-production environments.

```java
@PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
@GetMapping("/dashboard")
public DashboardDTO getDashboardSummary() {
    // Enterprise Comment: Demo mode security pattern - allow unauthenticated access in demo
    // environments while maintaining strict authentication in production deployments
}
```

**Controllers implementing this pattern**: `AnalyticsController`, `SupplierController`

### OAuth2 Identity Resolution
**Enterprise Pattern**: Seamless integration with OAuth2 providers for user identity management.

```java
@GetMapping("/me")
public Object me(Authentication auth) {
    // Enterprise Comment: OAuth2 identity resolution - extract user profile from various OAuth2 providers
    // supporting both OAuth2User (social login) and OidcUser (OpenID Connect) authentication flows
}
```

**Controllers implementing this pattern**: `AuthController`

---

## Validation Strategies

### Input Validation
- **Bean Validation**: `@Valid` annotation on request bodies
- **Path Variable Validation**: Implicit through Spring's type conversion
- **Request Parameter Validation**: Custom validation in controller methods

### ID Consistency Validation
**Enterprise Pattern**: Prevent path/body ID mismatches that could lead to unintended operations.

```java
@PutMapping("/{id}")
public ResponseEntity<SupplierDTO> update(@PathVariable String id, @Valid @RequestBody SupplierDTO dto) {
    // Enterprise Comment: Path vs body ID validation - ensure API contract consistency
    // by preventing mismatched identifiers that could lead to unintended updates
    if (dto.getId() != null && !id.equals(dto.getId())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Path id and body id must match");
    }
}
```

**Controllers implementing this pattern**: `SupplierController`, `InventoryItemController`

### Creation ID Validation
**Enterprise Pattern**: Prevent client-generated IDs on resource creation.

```java
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody SupplierDTO dto) {
    if (dto.getId() != null) {
        // Enterprise Comment: ID consistency validation - prevent client-generated IDs on creation
        // to maintain server-side ID generation control and avoid potential ID conflicts
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID must be null on create");
    }
}
```

**Controllers implementing this pattern**: `SupplierController`, `InventoryItemController`

---

## HTTP Status Code Standards

### Success Responses
- **200 OK**: Successful GET, PUT operations
- **201 Created**: Successful POST operations with `Location` header
- **204 No Content**: Successful DELETE operations

### Client Error Responses
- **400 Bad Request**: Validation errors, malformed requests
- **404 Not Found**: Resource not found (handled by service layer exceptions)
- **409 Conflict**: Resource conflicts (duplicates, referential integrity)

### Example Implementation
```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) {
    supplierService.delete(id); // May throw IllegalStateException -> 409
    return ResponseEntity.noContent().build(); // 204
}
```

---

## Enterprise Business Logic Patterns

### Default Date Window Strategy
**Enterprise Pattern**: Consistent default date ranges for time-based analytics.

```java
@GetMapping("/stock-value-over-time")
public List<StockValueDTO> getStockValueOverTime(
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
    @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
    
    // Enterprise Comment: Default date window strategy - provide sensible 30-day default for analytics
    // queries to ensure consistent behavior and prevent performance issues with unbounded queries
    if (startDate == null) startDate = LocalDate.now().minusDays(30);
    if (endDate == null) endDate = LocalDate.now();
}
```

**Controllers implementing this pattern**: `AnalyticsController`

### Cookie Expiration Strategy
**Enterprise Pattern**: Secure session management with configurable expiration.

```java
@PostMapping("/logout")
public ResponseEntity<Map<String, String>> apiLogout(HttpServletResponse response) {
    // Enterprise Comment: Cookie expiration strategy - explicitly expire authentication cookies
    // to ensure clean logout across different authentication mechanisms and prevent session leakage
    Cookie cookie = new Cookie("JSESSIONID", null);
    cookie.setMaxAge(0);
    cookie.setPath("/");
    response.addCookie(cookie);
}
```

**Controllers implementing this pattern**: `AuthController`

### Single-Page Application Hosting Pattern
**Enterprise Pattern**: Flexible frontend deployment through configurable redirection.

```java
@GetMapping("/")
public String root() {
    // Enterprise Comment: Single-page application hosting pattern - redirect root to configured frontend
    // rather than serving static content directly from Spring Boot, enabling flexible deployment models
    return "redirect:" + props.getFrontend().getBaseUrl();
}
```

**Controllers implementing this pattern**: `RootRedirectController`

---

## Error Handling Patterns

### Service Layer Exception Delegation
Controllers delegate business logic validation to service layers, which throw appropriate exceptions handled by `GlobalExceptionHandler`.

```java
@GetMapping("/{id}")
public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
    return supplierService.findById(id)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));
}
```

### Controller-Level Validation
For API contract violations, controllers throw `ResponseStatusException` directly:

```java
if (dto.getId() != null) {
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID must be null on create");
}
```

---

## Performance and Pagination

### Page Size Protection
**Enterprise Pattern**: Prevent memory issues from large page requests.

```java
@GetMapping("/search")
public Page<StockHistoryDTO> search(
    @PageableDefault(size = 50, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
    
    // Enterprise Comment: Page size protection - cap large page requests to prevent memory issues
    // and maintain reasonable response times for audit queries over large datasets
    pageable = PageRequest.of(
        pageable.getPageNumber(),
        Math.min(pageable.getPageSize(), MAX_PAGE_SIZE),
        pageable.getSort()
    );
}
```

**Controllers implementing this pattern**: `StockHistoryController`

### Date Range Validation
**Enterprise Pattern**: Prevent logical inconsistencies in temporal queries.

```java
if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
    // Enterprise Comment: Date range validation - prevent logical inconsistencies that could
    // cause confusion in audit reports and ensure temporal query validity
    throw new InvalidRequestException("endDate must be >= startDate");
}
```

**Controllers implementing this pattern**: `StockHistoryController`

---

## Controller-Specific Patterns

### AnalyticsController
- **Demo mode access** for read-only analytics
- **Default date windows** for time-based queries
- **Dashboard aggregation** endpoints
- **Flexible date filtering** with ISO-8601 format

### AuthController
- **OAuth2 provider abstraction** for multiple identity sources
- **Cookie-based session management**
- **Profile endpoint** with user authorities
- **Secure logout** with cookie cleanup

### InventoryItemController
- **Full CRUD operations** with role-based access
- **Quantity adjustment** endpoints with audit trails
- **Price update** operations
- **Search functionality** with partial name matching

### HealthCheckController
- **Basic health checks** for application status
- **Database connectivity** validation
- **Oracle-specific diagnostics** using SYS_CONTEXT queries

### SupplierController
- **Complete CRUD lifecycle** for supplier management
- **Search by name** with partial matching
- **Count endpoints** for dashboard statistics
- **Referential integrity** checks on deletion

### StockHistoryController
- **Audit trail queries** with multiple filter criteria
- **Paginated search** with configurable sorting
- **Item-specific history** tracking
- **Reason-based filtering** for change analysis

### RootRedirectController
- **Frontend redirection** to configured base URL
- **Deployment flexibility** for SPA hosting
- **Simple root path handling**

---

## Oracle Health Check Strategy
**Enterprise Pattern**: Database-specific health validation for production monitoring.

```java
@GetMapping("/db")
public ResponseEntity<Map<String, Object>> checkDatabaseConnection() {
    // Enterprise Comment: Oracle health check strategy - use SYS_CONTEXT for lightweight
    // connection validation rather than heavy schema queries, providing fast health status
    String query = "SELECT SYS_CONTEXT('USERENV', 'DB_NAME') as db_name FROM dual";
}
```

**Controllers implementing this pattern**: `HealthCheckController`

---

## Cross-References

### Related Documentation
- [Model Layer Patterns](model-patterns.md) - Entity and DTO design patterns
- [Repository Layer Patterns](repository-patterns.md) - Data access patterns
- [Service Layer Patterns](service-patterns.md) - Business logic patterns
- [Validation Patterns](validation-patterns.md) - Input validation strategies
- [Security Configuration Patterns](../../patterns/security-patterns.md) - OAuth2 authentication and authorization
- [Configuration Patterns](../../patterns/configuration-patterns.md) - Demo mode integration and AppProperties
- [Configuration API Integration](../../patterns/configuration-api-integration.md) - Role-based API security patterns

### Configuration Dependencies
- `AppProperties` - Application configuration for demo mode and frontend URLs
- `GlobalExceptionHandler` - Centralized exception handling
- Security configuration - OAuth2 and role-based access control

### Testing Considerations
- `@WebMvcTest` for controller layer testing
- Security context mocking for authorization tests
- MockMvc for endpoint integration testing

---

*Last updated: Step 2 of 6-step hybrid documentation approach*
*Controller transformations completed with lean JavaDoc and enterprise comments*