[⬅️ Back to Layers Overview](./index.md)

# Testing Repository Layer

## Test Setup with @DataJpaTest

Use `@DataJpaTest` to load only JPA components:

```java
@DataJpaTest
class SupplierRepositoryTest {
    
    @Autowired
    private SupplierRepository repository;
    
    @Autowired
    private TestEntityManager entityManager;
    
    // Tests run against test database (H2, TestContainers, etc)
}
```

## Testing Find Operations

```java
@DataJpaTest
class SupplierRepositoryTest {
    
    @Autowired
    private SupplierRepository repository;
    
    @Test
    void testFindByIdSuccess() {
        // Arrange
        Supplier supplier = new Supplier("ACME Corp", "John Doe");
        Supplier saved = repository.save(supplier);
        
        // Act
        Optional<Supplier> found = repository.findById(saved.getId());
        
        // Assert
        assertTrue(found.isPresent());
        assertEquals("ACME Corp", found.get().getName());
    }
    
    @Test
    void testFindByIdNotFound() {
        // Act & Assert
        Optional<Supplier> found = repository.findById("unknown-id");
        assertTrue(found.isEmpty());
    }
}
```

## Testing Derived Queries

```java
@DataJpaTest
class SupplierRepositoryTest {
    
    @Autowired
    private SupplierRepository repository;
    
    @Test
    void testFindByNameIgnoreCase() {
        // Arrange
        repository.save(new Supplier("ACME Corp", "John"));
        
        // Act
        Optional<Supplier> found = repository.findByNameIgnoreCase("acme corp");
        
        // Assert
        assertTrue(found.isPresent());
        assertEquals("ACME Corp", found.get().getName());
    }
    
    @Test
    void testFindByNameContainingIgnoreCase() {
        // Arrange
        repository.save(new Supplier("ACME Corp", "John"));
        repository.save(new Supplier("Global Ltd", "Jane"));
        
        // Act
        List<Supplier> results = repository.findByNameContainingIgnoreCase("acme");
        
        // Assert
        assertEquals(1, results.size());
        assertEquals("ACME Corp", results.get(0).getName());
    }
    
    @Test
    void testExistsByNameIgnoreCase() {
        // Arrange
        repository.save(new Supplier("ACME Corp", "John"));
        
        // Act & Assert
        assertTrue(repository.existsByNameIgnoreCase("acme corp"));
        assertFalse(repository.existsByNameIgnoreCase("unknown"));
    }
}
```

## Testing Custom Queries

```java
@DataJpaTest
class InventoryItemRepositoryTest {
    
    @Autowired
    private InventoryItemRepository repository;
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    @Test
    void testFindLowStockItems() {
        // Arrange
        Supplier supplier = supplierRepository.save(
            new Supplier("ACME", "John"));
        
        repository.save(new InventoryItem("Item A", supplier, 5, BigDecimal.TEN));
        repository.save(new InventoryItem("Item B", supplier, 100, BigDecimal.TEN));
        
        // Act
        List<InventoryItem> lowStock = repository.findLowStockItems(10);
        
        // Assert
        assertEquals(1, lowStock.size());
        assertEquals("Item A", lowStock.get(0).getName());
    }
}
```

## Testing Relationships

```java
@DataJpaTest
class InventoryItemRepositoryTest {
    
    @Autowired
    private InventoryItemRepository itemRepository;
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    @Test
    void testFindBySupplierWithEagerLoad() {
        // Arrange
        Supplier supplier = supplierRepository.save(
            new Supplier("ACME", "John"));
        
        InventoryItem item = new InventoryItem("Component", supplier);
        itemRepository.save(item);
        
        // Act
        Optional<InventoryItem> found = itemRepository.findById(item.getId());
        
        // Assert - Supplier eagerly loaded
        assertTrue(found.isPresent());
        assertEquals("ACME", found.get().getSupplier().getName());
    }
}
```

## Testing Pagination

```java
@DataJpaTest
class InventoryItemRepositoryTest {
    
    @Autowired
    private InventoryItemRepository repository;
    
    @Autowired
    private SupplierRepository supplierRepository;
    
    @Test
    void testFindWithPagination() {
        // Arrange
        Supplier supplier = supplierRepository.save(
            new Supplier("ACME", "John"));
        
        for (int i = 0; i < 25; i++) {
            repository.save(
                new InventoryItem("Item " + i, supplier));
        }
        
        // Act
        Pageable pageable = PageRequest.of(0, 10, Sort.by("name"));
        Page<InventoryItem> page = repository.findAll(pageable);
        
        // Assert
        assertEquals(10, page.getContent().size());
        assertEquals(25, page.getTotalElements());
        assertEquals(3, page.getTotalPages());
        assertTrue(page.isFirst());
        assertFalse(page.isLast());
    }
}
```

## Testing Optimistic Locking

```java
@DataJpaTest
class InventoryItemRepositoryTest {
    
    @Autowired
    private InventoryItemRepository repository;
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Test
    void testOptimisticLockingDetectsConflict() {
        // Arrange
        Supplier supplier = new Supplier("ACME", "John");
        InventoryItem item = new InventoryItem("Item", supplier);
        InventoryItem saved = repository.save(item);
        
        InventoryItem item1 = repository.findById(saved.getId()).get();
        InventoryItem item2 = repository.findById(saved.getId()).get();
        
        // Act
        item1.setQuantity(100);
        repository.save(item1);
        
        item2.setQuantity(200);
        
        // Assert - Should throw OptimisticLockException
        assertThrows(OptimisticLockException.class, () -> {
            repository.save(item2);
            entityManager.flush();
        });
    }
}
```

## Testing Constraints

```java
@DataJpaTest
class SupplierRepositoryTest {
    
    @Autowired
    private SupplierRepository repository;
    
    @Test
    void testUniquenessConstraint() {
        // Arrange
        repository.save(new Supplier("ACME Corp", "John"));
        
        // Act & Assert - Duplicate should fail
        assertThrows(DataIntegrityViolationException.class, () -> {
            repository.save(new Supplier("ACME Corp", "Jane"));
            // Force flush to trigger constraint check
        });
    }
    
    @Test
    void testNotNullConstraint() {
        // Act & Assert
        assertThrows(DataIntegrityViolationException.class, () -> {
            Supplier supplier = new Supplier(null, "John");  // Name is null
            repository.save(supplier);
        });
    }
}
```

## Testing with TestContainers

For real database testing:

```java
@DataJpaTest
@Container
class SupplierRepositoryTestWithTestContainers {
    
    static PostgreSQLContainer<?> postgres = 
        new PostgreSQLContainer<>(DockerImageName.parse("postgres:latest"));
    
    @Autowired
    private SupplierRepository repository;
    
    @Test
    void testWithRealDatabase() {
        // Tests run against real PostgreSQL instance
        Supplier supplier = repository.save(new Supplier("ACME", "John"));
        Optional<Supplier> found = repository.findById(supplier.getId());
        assertTrue(found.isPresent());
    }
}
```

---

[⬅️ Back to Layers Overview](./index.md)
