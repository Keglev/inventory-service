[⬅️ Back to Controller Index](./index.md)

# Request/Response Lifecycle

The complete flow of an HTTP request through the Controller Layer.

## Complete Request Flow

Here's how a typical request (creating a supplier) flows through all layers:

```
1. HTTP Request arrives at Spring DispatcherServlet
   POST /api/suppliers
   Content-Type: application/json
   Authorization: Bearer <token>
   { "name": "ACME Corp", ... }
   ↓
2. Request routing matches URL pattern to controller method
   DispatcherServlet identifies SupplierController.create()
   ↓
3. Spring Security checks @PreAuthorize annotation
   @PreAuthorize("hasRole('ADMIN')")
   ├─ If not authorized → AccessDeniedException → 403 Forbidden
   └─ If authorized → Continue
   ↓
4. @Valid triggers DTO field validation
   Validates CreateSupplierDTO fields
   ├─ @NotBlank on name field
   ├─ @Email on contactEmail field
   └─ All constraints checked
   ↓
   If validation fails:
   ├─ MethodArgumentNotValidException thrown
   ├─ GlobalExceptionHandler catches
   └─ Returns 400 Bad Request
   ↓
5. Jackson deserializes request body JSON → DTO
   { "name": "ACME Corp", ... }
      ↓
   CreateSupplierDTO object (fully populated)
   ↓
6. Controller method executes
   supplierService.create(dto)
   ↓
7. Service layer executes
   - Service validator checks business rules
   - Service calls repository
   - Repository persists to database
   - Service returns DTO
   ↓
   If exception in service:
   ├─ Service throws exception
   ├─ GlobalExceptionHandler catches
   └─ Returns 4xx or 5xx error
   ↓
8. Controller receives SupplierDTO from service
   Has: id, name, contactName, etc.
   ↓
9. Jackson serializes DTO → JSON response body
   SupplierDTO object
      ↓
   { "id": "abc123", "name": "ACME Corp", ... }
   ↓
10. Controller builds ResponseEntity with status code
    ResponseEntity.created(location).body(created)
    ├─ Status: 201 CREATED
    ├─ Location header: /api/suppliers/abc123
    └─ Body: Serialized DTO
    ↓
11. HTTP Response returned to client
    HTTP/1.1 201 Created
    Location: /api/suppliers/abc123
    Content-Type: application/json
    { "id": "abc123", "name": "ACME Corp", ... }
```

## Request Validation Checkpoint

```
Request JSON received
    ↓
DispatcherServlet routes to controller
    ↓
Spring Security @PreAuthorize check
    ├─ Not authenticated? → 401 Unauthorized
    ├─ Not authorized? → 403 Forbidden
    └─ Authorized? → Continue
    ↓
Jackson deserializes JSON → DTO
    ↓
@Valid annotation triggers field validation
    ├─ Any constraint violations? → 400 Bad Request
    └─ All valid? → Continue
    ↓
Controller method invoked
```

## Response Path

```
Service returns domain DTO
    ↓
Controller wraps in ResponseEntity
    ├─ Set status code (200, 201, 204, etc.)
    ├─ Add headers if needed (Location, etc.)
    └─ Add body if applicable
    ↓
Jackson serializes DTO → JSON
    ↓
HTTP Response to client
    ├─ Status line
    ├─ Headers
    └─ JSON body
```

## Error Handling Path

```
Any layer throws exception
    ↓
Exception propagates up to GlobalExceptionHandler
    ↓
Handler identifies exception type
    ├─ IllegalArgumentException → 400 Bad Request
    ├─ NoSuchElementException → 404 Not Found
    ├─ IllegalStateException → 409 Conflict
    ├─ AccessDeniedException → 403 Forbidden
    └─ Generic Exception → 500 Internal Server Error
    ↓
Handler builds ErrorResponse object
    ├─ Code: error type (BAD_REQUEST, NOT_FOUND, etc.)
    ├─ Message: human-readable explanation
    ├─ Path: request URL
    └─ Timestamp: when error occurred
    ↓
Jackson serializes ErrorResponse → JSON
    ↓
HTTP Error Response to client
    ├─ Appropriate status code (400, 404, 409, etc.)
    └─ JSON body with error details
```

---

[⬅️ Back to Controller Index](./index.md)
