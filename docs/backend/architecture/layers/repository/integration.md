[⬅️ Back to Layers Overview](./index.md)

# Integration with Other Layers

## Layer Architecture

```
┌──────────────────────────────────────┐
│      SERVICE LAYER                   │
│   (Business Logic, Orchestration)    │
│  Calls repository methods            │
│  Handles transactions                │
│  Maps between DTOs and entities      │
└────────────────┬─────────────────────┘
                 │ Uses
┌────────────────▼─────────────────────┐
│    REPOSITORY LAYER (You are here)   │
│   (Data Access Abstraction)          │
│  Spring Data JPA Repositories        │
│  Query methods (derived/custom)      │
│  Entity management via Hibernate     │
└────────────────┬─────────────────────┘
                 │ Queries/Persists
┌────────────────▼─────────────────────┐
│      HIBERNATE ORM                   │
│   (Object-Relational Mapping)        │
│  Maps objects to SQL                 │
│  Manages entity lifecycle            │
│  Handles transactions                │
└────────────────┬─────────────────────┘
                 │ SQL
┌────────────────▼─────────────────────┐
│      DATABASE                        │
│  PostgreSQL / Oracle                 │
│  Stores persistent data              │
│  Enforces constraints                │
│  Returns result sets                 │
└──────────────────────────────────────┘
```

## Key Integration Points

### 1. Service Calls Repository

Services inject repository interfaces and call methods:

```java
@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {
    
    private final SupplierRepository repository;  // Injected
    
    @Transactional
    public SupplierDTO create(CreateSupplierDTO dto) {
        // Service calls repository method
        Supplier saved = repository.save(mapper.toEntity(dto));
        return mapper.toDTO(saved);
    }
}
```

### 2. Repository Abstraction

Repositories abstract database details from services:

```java
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    // Spring Data implements at runtime
    // Service doesn't know about SQL or JDBC
}
```

### 3. Entity Management

Repositories return domain entities, not data transfer objects:

```java
@Service
public class SupplierServiceImpl {
    
    public SupplierDTO findById(String id) {
        // Repository returns entity
        Supplier entity = repository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Not found"));
        
        // Service transforms to DTO for response
        return mapper.toDTO(entity);
    }
}
```

### 4. Transaction Boundaries

Services manage transactions, repositories execute within them:

```java
@Service
@RequiredArgsConstructor
@Transactional  // Transaction boundary
public class InventoryItemServiceImpl {
    
    private final InventoryItemRepository itemRepository;
    private final StockHistoryRepository historyRepository;
    
    public void updateStock(String itemId, int newQuantity) {
        // Both operations in same transaction
        InventoryItem item = itemRepository.findById(itemId).get();
        
        StockHistory history = new StockHistory();
        history.setQuantity(newQuantity);
        historyRepository.save(history);
        
        // Commits together or rolls back together
    }
}
```

### 5. Exception Handling

Repository exceptions flow through service to controller:

```
Repository throws DataAccessException
  ↓
Service catches or rethrows
  ↓
GlobalExceptionHandler translates to HTTP response
  ↓
Controller returns error to client
```

## Complete Flow Example

### Create Supplier Request

```
1. HTTP POST /api/suppliers
   {"name": "ACME Corp", "contactName": "John Doe"}
   
2. SupplierController.create(CreateSupplierDTO)
   
3. SupplierService.create(CreateSupplierDTO)
   ├─ Validate input
   ├─ Call repository.save(entity)
   │  └─ Spring Data JPA Proxy
   │     └─ Hibernate
   │        └─ SQL: INSERT INTO SUPPLIER (...)
   │           └─ Database: SUPPLIER table
   ├─ Receive saved entity from repository
   └─ Return DTO to controller
   
4. SupplierController returns 201 Created with DTO
```

### Search Suppliers Request

```
1. HTTP GET /api/suppliers/search?query=acme&page=0&size=20
   
2. SupplierController.search(query, page, size)
   
3. SupplierService.search(query, pageable)
   ├─ Build Pageable with sort
   ├─ Call repository.findByNameContainingIgnoreCase(query, pageable)
   │  └─ Spring Data JPA Proxy
   │     └─ Derived Query Interpretation
   │        └─ SQL: SELECT * FROM SUPPLIER 
   │              WHERE NAME LIKE ? 
   │              LIMIT 20 OFFSET 0
   │           └─ Database: Execute query
   ├─ Receive Page<Supplier> with results
   ├─ Map entities to DTOs
   └─ Return Page<SupplierDTO> to controller
   
4. SupplierController returns 200 OK with Page of DTOs
```

## Data Flow Diagram

```
DTO IN         Entity         DTO OUT
  │              │              │
  ├─────────────┐│┌────────────┤
  │           Controller        │
  │             │ │             │
  └─────────────┤│┌────────────┘
                 │
            Service Layer
            ├─ Validate
            ├─ Map DTO→Entity
            ├─ Call Repository
            ├─ Map Entity→DTO
            └─ Return DTO
                 │
        REPOSITORY LAYER
        ├─ Find derived query
        ├─ Spring Data JPA
        │  generates proxy
        ├─ Hibernate ORM
        │  translates to SQL
        └─ Executes query
                 │
            DATABASE
            ├─ Execute SQL
            ├─ Enforce constraints
            └─ Return result set
                 │
            Hibernate Mapping
            ├─ ResultSet→Entity
            └─ Return Entity
                 │
            Service Layer
            └─ Maps Entity→DTO
                 │
            Controller Response
            └─ JSON to Client
```

---

[⬅️ Back to Layers Overview](./index.md)
