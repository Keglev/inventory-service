[⬅️ Back to Layers Overview](./index.md)

# Integration with Other Layers

## Layer Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  CONTROLLER LAYER                            │
│              (HTTP Requests/Responses)                        │
│  HTTP → DTO → Service Call → Response DTO → JSON             │
└────────────────────────┬─────────────────────────────────────┘
                         │ Calls ServiceInterface
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                  SERVICE LAYER                               │
│           (Business Logic & Orchestration)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Validates input                                      │ │
│  │ • Transforms DTO ↔ Entity                              │ │
│  │ • Executes business logic                              │ │
│  │ • Manages transactions                                 │ │
│  │ • Logs changes (audit)                                 │ │
│  │ • Throws domain exceptions                             │ │
│  └──────────────┬─────────────────────────────────────────┘ │
│  ┌──────────────▼─────────────────────────────────────────┐ │
│  │ Dependencies Injected:                                 │ │
│  │ • Repository (data access)                             │ │
│  │ • Validators (business rules)                          │ │
│  │ • Mappers (DTO ↔ Entity)                               │ │
│  │ • Other Services (orchestration)                       │ │
│  └──────────────┬─────────────────────────────────────────┘ │
└────────────────┼──────────────────────────────────────────────┘
                 │ Calls Repository
                 │
┌────────────────▼──────────────────────────────────────────────┐
│              REPOSITORY LAYER                                 │
│         (Data Access Abstraction)                             │
│  JPA Interface → Hibernate → SQL → Database                   │
└───────────────────────────────────────────────────────────────┘
```

## Key Integration Points

### 1. Controllers Call Services

Controllers invoke service methods and return service results:

```java
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {
    
    private final SupplierService service;
    
    @PostMapping
    public ResponseEntity<SupplierDTO> create(
            @RequestBody CreateSupplierDTO dto) {
        // Controller delegates to service
        SupplierDTO result = service.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(
            service.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Not found"))
        );
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SupplierDTO> update(
            @PathVariable String id,
            @RequestBody UpdateSupplierDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### 2. Services Use Repositories

Services call repositories to interact with database:

```java
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;
    private final SupplierValidator validator;
    private final SupplierMapper mapper;
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        // Validation layer
        validator.validateRequiredFields(dto);
        validator.validateUniquenessOnCreate(dto.getName());
        
        // Data mapper
        Supplier entity = mapper.toEntity(dto);
        
        // Repository layer
        Supplier saved = repository.save(entity);
        
        return mapper.toDTO(saved);
    }
}
```

### 3. Validators Enforce Business Rules

Services delegate business rule validation:

```java
@Component
@RequiredArgsConstructor
public class SupplierValidator {
    
    private final SupplierRepository repository;
    
    public void validateUniquenessOnCreate(String name) {
        if (repository.existsByNameIgnoreCase(name)) {
            throw new IllegalStateException("Duplicate supplier");
        }
    }
}
```

### 4. Mappers Transform DTOs to Entities

Services use mappers for boundary transformations:

```java
@Mapper(componentModel = "spring")
public interface SupplierMapper {
    
    // Inbound: API DTO → Domain Entity
    Supplier toEntity(CreateSupplierDTO dto);
    
    // Outbound: Domain Entity → API DTO
    SupplierDTO toDTO(Supplier entity);
}
```

### 5. Global Exception Handler Catches Service Exceptions

Services throw domain exceptions caught by controller advice:

```java
@Service
public class SupplierServiceImpl {
    public SupplierDTO create(CreateSupplierDTO dto) {
        if (duplicate) {
            throw new IllegalStateException("Duplicate");  // Thrown
        }
        return ...;
    }
}

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleConflict(
            IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("CONFLICT", ex.getMessage()));
    }
}
```

## Data Flow Example: Create Supplier

Complete flow from HTTP request to database persistence:

```
1. HTTP Request
   POST /api/suppliers
   {"name": "TechCorp", "contactName": "John Doe"}
   
2. Controller Deserialization
   CreateSupplierDTO {
     name: "TechCorp"
     contactName: "John Doe"
   }
   
3. Controller → Service
   SupplierService.create(dto)
   
4. Service Validation
   SupplierValidator.validateRequiredFields(dto)
   SupplierValidator.validateUniquenessOnCreate(name)
   
5. Service Transformation
   Mapper.toEntity(dto) → Supplier entity
   
6. Service Audit
   entity.setCreatedBy("john.doe")
   entity.setCreatedAt(now)
   
7. Service → Repository
   SupplierRepository.save(entity)
   
8. Database Persistence
   INSERT INTO SUPPLIER (ID, NAME, CONTACT_NAME, CREATED_BY, CREATED_AT)
   VALUES ('uuid-123', 'TechCorp', 'John Doe', 'john.doe', '2025-01-15 10:30:00')
   
9. Entity Returned
   Supplier {
     id: 'uuid-123'
     name: 'TechCorp'
     contactName: 'John Doe'
     createdBy: 'john.doe'
     createdAt: '2025-01-15 10:30:00'
   }
   
10. Service Response Transformation
    Mapper.toDTO(entity) → SupplierDTO
    
11. Controller Response
    200 OK (actually 201 Created)
    {"id": "uuid-123", "name": "TechCorp", ...}
    
12. HTTP Response
    JSON sent to client
```

## Services Calling Other Services

Services can depend on other services for complex operations:

```java
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryItemServiceImpl implements InventoryItemService {
    
    private final InventoryItemRepository itemRepository;
    private final StockHistoryService stockHistoryService;
    
    public InventoryItemDTO create(CreateInventoryItemDTO dto) {
        // Create the item
        InventoryItem item = mapper.toEntity(dto);
        InventoryItem saved = itemRepository.save(item);
        
        // Call another service within same transaction
        stockHistoryService.logInitialStock(saved);
        
        return mapper.toDTO(saved);
    }
}

@Service
@RequiredArgsConstructor
public class StockHistoryServiceImpl implements StockHistoryService {
    
    private final StockHistoryRepository repository;
    
    @Transactional
    public void logInitialStock(InventoryItem item) {
        StockHistory history = new StockHistory();
        history.setItem(item);
        history.setReason(StockChangeReason.ADJUSTMENT);
        history.setCreatedBy(getCurrentUsername());
        
        repository.save(history);
    }
}
```

---

[⬅️ Back to Layers Overview](./index.md)
