[⬅️ Back to Repository Index](./index.html)

# SupplierRepository

## Definition

```java
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {

    Optional<Supplier> findByNameIgnoreCase(String name);

    List<Supplier> findByNameContainingIgnoreCase(String namePart);

    boolean existsByNameIgnoreCase(String name);
}
```

## Purpose

Provides data access for **Supplier** entities with capabilities for:
- CRUD operations (Create, Read, Update, Delete via JpaRepository)
- Case-insensitive name lookup and search
- Uniqueness validation

---

## Inherited Methods (from JpaRepository)

### Create/Persist

```java
// Single entity
Supplier saved = supplierRepository.save(supplier);

// Multiple entities
List<Supplier> saved = supplierRepository.saveAll(suppliers);
```

### Read

```java
// By primary key
Optional<Supplier> supplier = supplierRepository.findById(id);

// All suppliers
List<Supplier> all = supplierRepository.findAll();

// Pagination
Page<Supplier> page = supplierRepository.findAll(
    PageRequest.of(0, 20)
);

// With sorting
List<Supplier> sorted = supplierRepository.findAll(
    Sort.by("name").ascending()
);
```

### Count

```java
// Total suppliers
long total = supplierRepository.count();

// With condition
long count = supplierRepository.count();
```

### Delete (Discouraged)

```java
// By ID
supplierRepository.deleteById(id);

// Entity
supplierRepository.delete(supplier);

// All (⚠️ Use carefully!)
supplierRepository.deleteAll();
```

---

## Custom Query Methods

### findByNameIgnoreCase(String name)

**Purpose:** Find supplier by exact name (case-insensitive)

**Type:** Method-derived JPQL

**Generated SQL:**
```sql
SELECT s FROM Supplier s
WHERE LOWER(s.name) = LOWER(:name)
```

**Usage:**
```java
Optional<Supplier> supplier = supplierRepository
    .findByNameIgnoreCase("ACME Corporation");

if (supplier.isPresent()) {
    System.out.println("Found: " + supplier.get().getName());
} else {
    System.out.println("Not found");
}
```

**Use Cases:**
- Uniqueness validation (before create/update)
- User lookup by exact name
- Deduplication checks

**Performance:**
- Uses database index on `name` column
- ✅ Fast O(log n) lookup

**Returns:**
- `Optional<Supplier>` - Contains supplier or empty

---

### findByNameContainingIgnoreCase(String namePart)

**Purpose:** Search suppliers by name substring (case-insensitive)

**Type:** Method-derived JPQL

**Generated SQL:**
```sql
SELECT s FROM Supplier s
WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :namePart, '%'))
```

**Usage:**
```java
// All suppliers containing "corp"
List<Supplier> results = supplierRepository
    .findByNameContainingIgnoreCase("corp");

// Prints: "ACME Corporation", "Global Corp", etc.
for (Supplier s : results) {
    System.out.println(s.getName());
}
```

**Use Cases:**
- Search/autocomplete endpoints
- Find suppliers by partial name
- Supplier discovery

**Performance:**
- Table scan (no index for LIKE patterns)
- Consider pagination for large datasets

```java
// Better: Paginated search
Page<Supplier> results = supplierRepository.findByNameContainingIgnoreCase(
    "corp",
    PageRequest.of(0, 20)  // First 20 results
);
```

**Returns:**
- `List<Supplier>` - All matching suppliers

---

### existsByNameIgnoreCase(String name)

**Purpose:** Check if supplier exists by name (for validation)

**Type:** Method-derived JPQL

**Generated SQL:**
```sql
SELECT COUNT(s) > 0
FROM Supplier s
WHERE LOWER(s.name) = LOWER(:name)
```

**Usage:**
```java
// Before creating new supplier
if (supplierRepository.existsByNameIgnoreCase("ACME Corp")) {
    throw new DuplicateSupplierException("Name already exists");
}

// Save new supplier
Supplier newSupplier = Supplier.builder()
    .name("ACME Corp")
    .email("contact@acme.com")
    .createdBy(currentUser)
    .createdAt(LocalDateTime.now())
    .build();

supplierRepository.save(newSupplier);
```

**Use Cases:**
- Validate supplier name uniqueness
- Prevent duplicate entries
- Pre-save validation

**Performance:**
- Uses index on `name` column
- ✅ Very fast (only counts, doesn't fetch data)
- More efficient than `findByName().isPresent()`

**Returns:**
- `boolean` - true if exists, false otherwise

---

## Service Integration Pattern

Typical service usage:

```java
@Service
public class SupplierService {
    
    @Autowired
    private SupplierRepository repository;
    
    @Transactional
    public SupplierDTO createSupplier(CreateSupplierRequest request, String userId) {
        // Validate uniqueness
        if (repository.existsByNameIgnoreCase(request.getName())) {
            throw new DuplicateSupplierException(
                "Supplier name already exists: " + request.getName()
            );
        }
        
        // Create entity
        Supplier supplier = Supplier.builder()
            .id(UUID.randomUUID().toString())
            .name(request.getName())
            .email(request.getEmail())
            .contactName(request.getContactName())
            .phone(request.getPhone())
            .createdBy(userId)
            .createdAt(LocalDateTime.now())
            .build();
        
        // Persist
        supplier = repository.save(supplier);
        
        // Return DTO
        return mapToDTO(supplier);
    }
    
    @Transactional(readOnly = true)
    public SupplierDTO getSupplier(String supplierId) {
        Supplier supplier = repository.findById(supplierId)
            .orElseThrow(() -> new SupplierNotFoundException(
                "Supplier not found: " + supplierId
            ));
        
        return mapToDTO(supplier);
    }
    
    @Transactional(readOnly = true)
    public List<SupplierDTO> searchSuppliers(String query) {
        List<Supplier> suppliers = repository
            .findByNameContainingIgnoreCase(query);
        
        return suppliers.stream()
            .map(this::mapToDTO)
            .collect(toList());
    }
}
```

---

## Testing

### Repository Test

```java
@DataJpaTest
class SupplierRepositoryTest {
    
    @Autowired
    private SupplierRepository repository;
    
    @Test
    void testFindByNameIgnoreCase() {
        // Setup
        Supplier supplier = Supplier.builder()
            .name("ACME Corporation")
            .email("contact@acme.com")
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
        repository.save(supplier);
        
        // Test: exact name
        Optional<Supplier> found = repository
            .findByNameIgnoreCase("acme corporation");
        
        assertTrue(found.isPresent());
        assertEquals("ACME Corporation", found.get().getName());
    }
    
    @Test
    void testFindByNameContainingIgnoreCase() {
        // Setup
        repository.save(createSupplier("ACME Corporation"));
        repository.save(createSupplier("Global Corp"));
        repository.save(createSupplier("TechParts Ltd"));
        
        // Test
        List<Supplier> results = repository
            .findByNameContainingIgnoreCase("corp");
        
        assertEquals(2, results.size());
    }
    
    @Test
    void testExistsByNameIgnoreCase() {
        // Setup
        repository.save(createSupplier("ACME Corporation"));
        
        // Test
        assertTrue(repository.existsByNameIgnoreCase("acme corporation"));
        assertFalse(repository.existsByNameIgnoreCase("nonexistent"));
    }
    
    private Supplier createSupplier(String name) {
        return Supplier.builder()
            .name(name)
            .createdBy("test")
            .createdAt(LocalDateTime.now())
            .build();
    }
}
```

### Service Test

```java
@SpringBootTest
@Transactional
class SupplierServiceTest {
    
    @Autowired
    private SupplierService service;
    
    @Autowired
    private SupplierRepository repository;
    
    @Test
    void testCreateSupplier() throws Exception {
        CreateSupplierRequest request = new CreateSupplierRequest();
        request.setName("New Supplier");
        request.setEmail("contact@new.com");
        
        SupplierDTO created = service.createSupplier(request, "test-user");
        
        assertNotNull(created.getId());
        assertEquals("New Supplier", created.getName());
        
        // Verify persisted
        Supplier persisted = repository.findByNameIgnoreCase("New Supplier").get();
        assertEquals("test-user", persisted.getCreatedBy());
    }
    
    @Test
    void testCreateDuplicateNameThrows() {
        // Create first supplier
        CreateSupplierRequest request1 = new CreateSupplierRequest();
        request1.setName("ACME Corp");
        service.createSupplier(request1, "test-user");
        
        // Try to create duplicate
        CreateSupplierRequest request2 = new CreateSupplierRequest();
        request2.setName("acme corp");  // Different casing
        
        assertThrows(DuplicateSupplierException.class,
            () -> service.createSupplier(request2, "test-user"));
    }
}
```

---

## Common Queries

```java
// Find supplier by ID
Supplier supplier = supplierRepository.findById(id).get();

// Find by name (exact)
Supplier supplier = supplierRepository.findByNameIgnoreCase("ACME").get();

// Search by name (partial)
List<Supplier> suppliers = supplierRepository
    .findByNameContainingIgnoreCase("acme");

// Check existence
boolean exists = supplierRepository.existsByNameIgnoreCase("ACME");

// Get all suppliers
List<Supplier> all = supplierRepository.findAll();

// Get suppliers paginated
Page<Supplier> page = supplierRepository.findAll(
    PageRequest.of(0, 20)
);

// Count total suppliers
long total = supplierRepository.count();
```

---

## Related Documentation

- [Data Models - Supplier Entity](../model/supplier.html)
- [Repository Layer Index](./index.html)
- [Service Layer](../layers/service-layer.html)

---

[⬅️ Back to Repository Index](./index.html)
