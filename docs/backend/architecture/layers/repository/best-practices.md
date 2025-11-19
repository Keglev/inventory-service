[⬅️ Back to Layers Overview](./index.md)

# Repository Layer Best Practices

## 1. Query Method Naming Conventions

Follow Spring Data JPA naming conventions for readability and consistency:

```java
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    
    // ✅ GOOD - Clear, descriptive names
    List<Supplier> findByStatus(SupplierStatus status);
    Page<Supplier> findByNameContainingIgnoreCase(String name, Pageable pageable);
    Optional<Supplier> findByExternalIdAndStatus(String externalId, SupplierStatus status);
    long countByStatusAndCreatedDateAfter(SupplierStatus status, LocalDateTime date);
    boolean existsByName(String name);
    
    // ❌ AVOID - Vague or misleading names
    List<Supplier> getSuppliers();  // By what criteria?
    Page<Supplier> search(String query, Pageable pageable);  // Unclear what field
    Supplier getActive();  // Which field defines "active"?
}
```

## 2. Pagination and Sorting

Always use pagination for large result sets:

```java
// ✅ GOOD - Paginated with sorting
Page<SupplierDTO> getSuppliers(int page, int size, String sortBy) {
    Pageable pageable = PageRequest.of(
        page,
        size,
        Sort.Direction.ASC,
        sortBy
    );
    return supplierRepository.findAll(pageable)
        .map(mapper::toDTO);
}

// ❌ AVOID - Fetching all records
List<SupplierDTO> getAllSuppliers() {
    return supplierRepository.findAll()  // Could be millions!
        .stream()
        .map(mapper::toDTO)
        .collect(toList());
}
```

## 3. Lazy Loading and N+1 Problems

Use `@EntityGraph` or joins to prevent N+1 queries:

```java
@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    
    // ❌ PROBLEM - N+1 Query Issue
    // Loading orders triggers 1 query
    // Accessing order.getItems() triggers N more queries
    @Query("SELECT o FROM Order o")
    List<Order> findAll();
    
    // ✅ GOOD - Fetch items eagerly with one query
    @Query("SELECT o FROM Order o JOIN FETCH o.items")
    List<Order> findAllWithItems();
    
    // ✅ ALTERNATIVE - Using EntityGraph
    @EntityGraph(attributePaths = {"items"})
    List<Order> findAllEager();
}
```

## 4. Custom Queries

Use `@Query` for complex queries instead of long method names:

```java
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    // ✅ GOOD - Explicit and clear
    @Query("""
        SELECT i FROM InventoryItem i
        WHERE i.quantity < i.reorderLevel
        AND i.status = 'ACTIVE'
        ORDER BY i.reorderLevel - i.quantity DESC
    """)
    List<InventoryItem> findLowStockItems();
    
    // ❌ AVOID - Complex derived query name
    List<InventoryItem> findByQuantityLessThanAndReorderLevelGreaterThanAndStatusEquals(
        int quantity, int reorderLevel, ItemStatus status
    );
}
```

## 5. Specifications for Dynamic Queries

Use Specifications for complex, dynamic filtering:

```java
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String>,
                                           JpaSpecificationExecutor<Supplier> {
}

// Specification implementation
public class SupplierSpecifications {
    
    public static Specification<Supplier> byStatus(SupplierStatus status) {
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }
    
    public static Specification<Supplier> byNameContains(String name) {
        return (root, query, cb) ->
            cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }
    
    public static Specification<Supplier> byCreatedDateAfter(LocalDateTime date) {
        return (root, query, cb) -> cb.greaterThan(root.get("createdDate"), date);
    }
}

// Service usage
@Service
public class SupplierSearchService {
    
    public Page<SupplierDTO> searchSuppliers(SearchFilter filter, Pageable pageable) {
        Specification<Supplier> spec = Specification
            .where(byStatus(filter.getStatus()))
            .and(byNameContains(filter.getName()))
            .and(byCreatedDateAfter(filter.getFromDate()));
        
        return supplierRepository.findAll(spec, pageable)
            .map(mapper::toDTO);
    }
}
```

## 6. Projections for DTO Mapping

Use projections to avoid loading unnecessary fields:

```java
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {
    
    // ✅ GOOD - Projection: only loads needed fields
    @Query("""
        SELECT NEW com.example.dto.SupplierNameDTO(s.id, s.name)
        FROM Supplier s
        WHERE s.status = 'ACTIVE'
    """)
    List<SupplierNameDTO> findActiveSupplierNames();
}

// DTO for projection
public record SupplierNameDTO(String id, String name) {}
```

## 7. Proper Exception Handling

Let Spring Data translate exceptions appropriately:

```java
@Service
@RequiredArgsConstructor
public class SupplierService {
    
    private final SupplierRepository repository;
    
    public SupplierDTO findById(String id) {
        return repository.findById(id)
            .map(mapper::toDTO)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Supplier not found with id: " + id
            ));
    }
    
    public SupplierDTO create(CreateSupplierDTO dto) {
        try {
            // DataIntegrityViolationException (from Spring) if constraint fails
            Supplier saved = repository.save(mapper.toEntity(dto));
            return mapper.toDTO(saved);
        } catch (DataIntegrityViolationException e) {
            throw new BadRequestException(
                "Supplier with this name already exists",
                e
            );
        }
    }
}
```

## 8. Transaction Management at Service Level

Never manage transactions at repository level:

```java
// ❌ AVOID - Transaction logic at repository level
@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    
    @Transactional  // WRONG PLACE
    void processOrder(Order order);
}

// ✅ GOOD - Transaction management at service level
@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {
    
    private final OrderRepository orderRepository;
    private final InventoryItemRepository itemRepository;
    
    // Single transaction for multiple repository calls
    public OrderDTO processOrder(OrderDTO dto) {
        Order order = mapper.toEntity(dto);
        order = orderRepository.save(order);
        
        // Update inventory
        for (OrderItem item : order.getItems()) {
            InventoryItem inventory = itemRepository.findById(item.getItemId()).get();
            inventory.decreaseQuantity(item.getQuantity());
            itemRepository.save(inventory);
        }
        
        return mapper.toDTO(order);
    }
}
```

## 9. Batch Operations

Use batch operations for bulk updates:

```java
@Service
@RequiredArgsConstructor
public class BulkInventoryService {
    
    private final InventoryItemRepository repository;
    
    // ❌ AVOID - Individual saves (N queries)
    public void updateQuantitiesIndividual(List<InventoryItem> items) {
        items.forEach(item -> repository.save(item));
    }
    
    // ✅ GOOD - Batch save (1-2 queries)
    public void updateQuantitiesBatch(List<InventoryItem> items) {
        repository.saveAll(items);
    }
    
    // ✅ EVEN BETTER - Custom batch update
    @Modifying
    @Transactional
    @Query("""
        UPDATE InventoryItem i
        SET i.quantity = i.quantity - :amount
        WHERE i.status = 'ACTIVE'
        AND i.quantity >= :amount
    """)
    int decreaseAllActiveQuantities(@Param("amount") int amount);
}
```

## 10. Repository Testing

Test repositories with embedded database:

```java
@DataJpaTest
@ActiveProfiles("test")
class SupplierRepositoryTests {
    
    @Autowired
    private SupplierRepository repository;
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Test
    void testFindByStatus() {
        // Setup
        Supplier supplier = new Supplier("S1", "Test Corp", SupplierStatus.ACTIVE);
        entityManager.persistAndFlush(supplier);
        
        // Execute
        List<Supplier> results = repository.findByStatus(SupplierStatus.ACTIVE);
        
        // Assert
        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Test Corp");
    }
    
    @Test
    void testPaginatedSearch() {
        // Setup
        IntStream.rangeClosed(1, 25)
            .forEach(i -> {
                Supplier s = new Supplier("S" + i, "Supplier " + i, SupplierStatus.ACTIVE);
                entityManager.persistAndFlush(s);
            });
        
        // Execute
        Page<Supplier> page = repository.findAll(PageRequest.of(0, 10));
        
        // Assert
        assertThat(page.getTotalElements()).isEqualTo(25);
        assertThat(page.getContent()).hasSize(10);
    }
}
```

## Summary Checklist

- ✅ Use clear, conventional method names
- ✅ Always paginate large result sets
- ✅ Use `@EntityGraph` or `JOIN FETCH` to prevent N+1
- ✅ Use `@Query` for complex queries
- ✅ Use Specifications for dynamic filtering
- ✅ Use projections to minimize data loading
- ✅ Handle exceptions at service layer
- ✅ Manage transactions at service layer
- ✅ Use batch operations for bulk updates
- ✅ Test repositories with `@DataJpaTest`

---

[⬅️ Back to Layers Overview](./index.md)
