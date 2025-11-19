[⬅️ Back to Layers Overview](./index.md)

# Cross-Cutting Concerns

## Exception Handling Strategy

Services throw domain exceptions, controller layer catches and translates:

```java
// Service throws domain exception
@Service
public class SupplierServiceImpl implements SupplierService {
    
    public SupplierDTO create(CreateSupplierDTO dto) {
        if (repository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalStateException("Supplier exists");  // 409
        }
        return mapper.toDTO(repository.save(mapper.toEntity(dto)));
    }
}

// GlobalExceptionHandler catches and translates
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("CONFLICT", ex.getMessage()));
    }
}
```

## Exception Hierarchy

Services should throw appropriate exceptions for clear translation:

| Exception | HTTP Status | Meaning |
|---|---|---|
| `IllegalStateException` | 409 Conflict | Business rule violation |
| `NoSuchElementException` | 404 Not Found | Resource not found |
| `IllegalArgumentException` | 400 Bad Request | Invalid input |
| `UnsupportedOperationException` | 501 Not Implemented | Not supported |

## Logging

Services log important operations for debugging and compliance:

```java
@Service
@Slf4j
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        log.info("Creating supplier: {}", dto.getName());
        
        try {
            SupplierDTO result = doCreate(dto);
            log.info("Supplier created successfully: {}", result.getId());
            return result;
        } catch (Exception e) {
            log.error("Failed to create supplier: {}", dto.getName(), e);
            throw e;
        }
    }
    
    private SupplierDTO doCreate(CreateSupplierDTO dto) {
        Supplier entity = mapper.toEntity(dto);
        return mapper.toDTO(repository.save(entity));
    }
}
```

### Logging Levels

- **INFO** - Business operations (create, update, delete)
- **WARN** - Potential issues (duplicate attempts, validation failures)
- **ERROR** - Unrecoverable failures (database errors, unexpected exceptions)
- **DEBUG** - Detailed information for troubleshooting (variable states, flow tracing)

### Logging Best Practices

```java
// ✅ Good - Clear, structured logging
@Service
@Slf4j
public class InventoryItemServiceImpl {
    
    @Transactional
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        log.info("Creating item: name={}, supplier={}, quantity={}", 
            dto.getName(), dto.getSupplierId(), dto.getQuantity());
        
        InventoryItem item = mapper.toEntity(dto);
        InventoryItem saved = repository.save(item);
        
        log.info("Item created: id={}, name={}", 
            saved.getId(), saved.getName());
        
        return mapper.toDTO(saved);
    }
}

// ❌ Bad - Vague logging
@Service
@Slf4j
public class InventoryItemServiceImpl {
    
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        log.info("Creating item");  // Too vague
        
        try {
            return mapper.toDTO(repository.save(mapper.toEntity(dto)));
        } catch (Exception e) {
            log.error("Error", e);  // Missing context
            throw e;
        }
    }
}
```

### Monitoring with Logs

Use structured logging for production monitoring:

```java
@Service
@Slf4j
public class AnalyticsServiceImpl implements AnalyticsService {
    
    @Transactional(readOnly = true)
    public DashboardSummaryDTO getDashboardSummary() {
        long startTime = System.currentTimeMillis();
        
        try {
            DashboardSummaryDTO result = calculateSummary();
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("Dashboard calculation completed in {}ms, " +
                    "items={}, suppliers={}, value={}", 
                duration, 
                result.getItemCount(), 
                result.getSupplierCount(), 
                result.getInventoryValue());
            
            return result;
        } catch (Exception e) {
            log.error("Dashboard calculation failed after {}ms", 
                System.currentTimeMillis() - startTime, e);
            throw e;
        }
    }
}
```

---

[⬅️ Back to Layers Overview](./index.md)
