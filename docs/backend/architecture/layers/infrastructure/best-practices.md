[⬅️ Back to Infrastructure Index](./index.md)

# Best Practices

Guidelines and standards for infrastructure concerns across the application.

## 1. Centralize Exception Handling

Use `@RestControllerAdvice` for all exception mapping instead of handling exceptions in controllers:

```java
// ✅ Good - One place for all error handling
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handle(IllegalStateException ex) { 
        return ResponseEntity.status(HttpStatus.CONFLICT).body(...);
    }
}

// ❌ Bad - Exception handling scattered throughout code
@RestController
public class SupplierController {
    try { ... }
    catch (IllegalStateException e) { 
        return ResponseEntity.status(409).body(...);
    }
}
```

## 2. Separate Validation from Business Logic

Keep validators as single-responsibility components:

```java
// ✅ Good - Validation in separate class
@Component
public class SupplierValidator {
    public void validateUniquenessOnCreate(String name) { ... }
}

@Service
public class SupplierServiceImpl {
    private final SupplierValidator validator;
    public SupplierDTO create(CreateSupplierDTO dto) {
        validator.validateRequiredFields(dto);
        validator.validateUniquenessOnCreate(dto.getName());
        // Business logic follows validation
    }
}

// ❌ Bad - Validation mixed with business logic
@Service
public class SupplierServiceImpl {
    public SupplierDTO create(CreateSupplierDTO dto) {
        if (dto.getName() == null) throw new IllegalArgumentException(...);
        if (repository.existsByName(dto.getName())) 
            throw new IllegalStateException(...);
        // More business logic here...
    }
}
```

## 3. Use Consistent Error Response Format

All errors must follow the same structure:

```json
{
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "path": "/api/endpoint",
    "timestamp": "2024-11-19T10:30:45"
}
```

This ensures consistent API behavior across all endpoints.

## 4. Validate at Multiple Layers

Defense in depth protects data integrity:

```
1. DTO Field Validation    (@Valid, @NotNull, @Email)
   ↓
2. Service Business Rules  (Custom validators)
   ↓
3. Database Constraints    (UNIQUE, NOT NULL, FOREIGN KEY)
```

## 5. Always Check @PreAuthorize

Never assume user has sufficient permissions:

```java
// ✅ Good - Explicit authorization check
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) { ... }

// ❌ Bad - No authorization check
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) { ... }
```

## 6. Get Current User from SecurityContext

Access user information from Spring Security, never pass as parameter:

```java
// ✅ Good - SecurityContext is always available
String currentUser = SecurityContextHolder.getContext()
    .getAuthentication().getName();

// ❌ Bad - User passed as parameter
public void create(CreateSupplierDTO dto, String userId) { ... }
```

## 7. Use MapStruct for Complex Transformations

Let MapStruct generate mapping code for you:

```java
// ✅ Good - Let MapStruct handle it
@Mapper(componentModel = "spring")
public interface SupplierMapper {
    SupplierDTO toDTO(Supplier supplier);
}

// ❌ Bad - Manual getter/setter chains
public SupplierDTO toDTO(Supplier s) {
    SupplierDTO dto = new SupplierDTO();
    dto.setId(s.getId());
    dto.setName(s.getName());
    // ... 20 more lines
    return dto;
}
```

---

[⬅️ Back to Infrastructure Index](./index.md)
