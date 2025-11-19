[⬅️ Back to Layers Overview](./index.md)

# Exception Translation

## Pattern Overview

Services throw domain-specific exceptions. The global exception handler catches these and translates to appropriate HTTP responses.

## Service → Domain Exception Pattern

Services throw domain exceptions based on business rule violations:

```java
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    private final SupplierValidator validator;
    
    public SupplierDTO create(CreateSupplierDTO dto) {
        // Throws IllegalStateException (domain logic failure)
        if (repository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalStateException("Supplier with name already exists");
        }
        
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    }
}
```

## GlobalExceptionHandler → HTTP Response

The global exception handler catches exceptions and translates to HTTP:

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    // Handle duplicate supplier
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex) {
        log.warn("Business rule violation: {}", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ErrorResponse.builder()
                .code("CONFLICT")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build());
    }
    
    // Handle missing supplier
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            NoSuchElementException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.builder()
                .code("NOT_FOUND")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build());
    }
    
    // Handle validation failures
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex) {
        log.warn("Invalid argument: {}", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse.builder()
                .code("BAD_REQUEST")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build());
    }
}
```

## Exception Mapping Guide

| Domain Exception | HTTP Status | Use Case |
|---|---|---|
| `IllegalStateException` | 409 Conflict | Business rule violation, duplicate resource |
| `NoSuchElementException` | 404 Not Found | Resource not found |
| `IllegalArgumentException` | 400 Bad Request | Invalid input parameters |
| `UnsupportedOperationException` | 501 Not Implemented | Operation not available |

## Example: Complete Flow

### 1. Controller Call
```java
@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {
    
    @PostMapping
    public ResponseEntity<SupplierDTO> create(
            @RequestBody CreateSupplierDTO dto) {
        // Call service (may throw exception)
        return ResponseEntity.ok(service.create(dto));
    }
}
```

### 2. Service Throws Exception
```java
@Service
public class SupplierServiceImpl implements SupplierService {
    
    public SupplierDTO create(CreateSupplierDTO dto) {
        if (repository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalStateException("Duplicate supplier");
        }
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    }
}
```

### 3. Handler Catches & Translates
```
Controller throws → GlobalExceptionHandler catches
→ Exception matched to @ExceptionHandler
→ Returns ErrorResponse with HTTP 409
```

### 4. Client Receives
```json
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "code": "CONFLICT",
  "message": "Supplier with name already exists",
  "timestamp": "2025-01-15T10:30:00"
}
```

## Anti-Pattern: Catching and Swallowing

```java
// ❌ Bad - Exception caught but not handled
public SupplierDTO create(CreateSupplierDTO dto) {
    try {
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    } catch (Exception e) {
        return null;  // Lost error information
    }
}
```

## Best Practice: Let Exceptions Propagate

```java
// ✅ Good - Let exceptions propagate to handler
public SupplierDTO create(CreateSupplierDTO dto) {
    if (repository.existsByNameIgnoreCase(dto.getName())) {
        throw new IllegalStateException("Duplicate supplier");
    }
    
    return mapper.toDTO(repository.save(mapper.toEntity(dto)));
}
```

---

[⬅️ Back to Layers Overview](./index.md)
