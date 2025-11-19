[⬅️ Back to Layers Overview](./index.md)

# Pagination and Sorting

## Pattern Overview

Handle large result sets efficiently using Spring's `Pageable` and `Sort` interfaces.

## Basic Pagination

Using Spring's `Pageable` interface:

```java
// Repository method
List<InventoryItem> findAll(Pageable pageable);

// Service layer usage
Pageable pageable = PageRequest.of(0, 20);  // Page 0, 20 items per page
Page<InventoryItem> page = repository.findAll(pageable);

// Results
System.out.println("Total items: " + page.getTotalElements());
System.out.println("Total pages: " + page.getTotalPages());
System.out.println("Current page: " + page.getNumber());
System.out.println("Page size: " + page.getSize());
System.out.println("Items: " + page.getContent());
```

## Sorting

Add sorting to pagination:

```java
import org.springframework.data.domain.Sort;

// Sort by name ascending
Pageable pageable = PageRequest.of(0, 20, Sort.by("name").ascending());

// Sort by multiple fields
Pageable pageable = PageRequest.of(0, 20, 
    Sort.by("supplier").ascending()
        .and(Sort.by("name").ascending()));

// Sort descending
Pageable pageable = PageRequest.of(0, 20, Sort.by("createdAt").descending());
```

## Pagination with Search

Combine pagination with filtered queries:

```java
@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
    
    // Method returns Page for automatic pagination
    Page<InventoryItem> findByNameContainingIgnoreCaseOrderByNameAsc(
        String name, 
        Pageable pageable);
    
    // Custom query with pagination
    @Query("SELECT i FROM InventoryItem i WHERE i.supplierId = :supplierId")
    Page<InventoryItem> findBySupplier(
        @Param("supplierId") String supplierId, 
        Pageable pageable);
}

// Service usage
Pageable pageable = PageRequest.of(0, 20, Sort.by("name").ascending());
Page<InventoryItem> results = repository.findByNameContainingIgnoreCaseOrderByNameAsc(
    "component", 
    pageable);
```

## Complete Example

```java
@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl {
    
    private final InventoryItemRepository repository;
    
    public Page<InventoryItemDTO> search(
            String query, 
            int pageNumber, 
            int pageSize, 
            String sortBy) {
        
        // Build pageable with sort
        Sort.Direction direction = "asc".equals(sortBy) 
            ? Sort.Direction.ASC 
            : Sort.Direction.DESC;
        
        Pageable pageable = PageRequest.of(
            pageNumber, 
            pageSize, 
            Sort.by(direction, "name"));
        
        // Execute paginated query
        Page<InventoryItem> page = repository
            .findByNameContainingIgnoreCase(query, pageable);
        
        // Transform to DTOs
        return page.map(mapper::toDTO);
    }
}

// Controller usage
@GetMapping("/search")
public ResponseEntity<Page<InventoryItemDTO>> search(
        @RequestParam String query,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(defaultValue = "name") String sortBy) {
    
    Page<InventoryItemDTO> results = service.search(query, page, size, sortBy);
    return ResponseEntity.ok(results);
}
```

## HTTP Example

Request with pagination:
```
GET /api/items/search?query=component&page=0&size=20&sortBy=name
```

Response:
```json
{
  "content": [
    {
      "id": "item-1",
      "name": "Component A",
      "quantity": 100
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": "name: ASC"
  },
  "totalElements": 150,
  "totalPages": 8,
  "numberOfElements": 20,
  "first": true,
  "last": false
}
```

## Benefits

✅ **Memory Efficient** - Only loads one page at a time  
✅ **Performance** - Database handles LIMIT/OFFSET  
✅ **Scalability** - Works with millions of records  
✅ **User-Friendly** - Browser history, URLs are meaningful  
✅ **SEO-Friendly** - Pagination URLs are crawlable  

---

[⬅️ Back to Layers Overview](./index.md)
