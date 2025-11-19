[⬅️ Back to Layers Overview](./index.md)

# Optimistic Locking

## Pattern Overview

Optimistic locking prevents concurrent modification conflicts by checking a version field before updates.

## Implementation

```java
@Entity
@Table(name = "INVENTORY_ITEM")
public class InventoryItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String name;
    private int quantity;
    private BigDecimal unitPrice;
    
    // Version field for optimistic locking
    @Version
    private Long version;
}
```

## How It Works

1. **Read** entity with version (e.g., version = 5)
2. **Modify** the entity in memory
3. **Save** entity back to database
4. **Hibernate checks** `WHERE version = 5`
5. **If match:** Update succeeds, version increments to 6
6. **If no match:** Another thread modified it, throw `OptimisticLockException`

## Example Scenario

### Thread A
```java
// Read with version 5
InventoryItem item = repository.findById("item-1").get();
// version = 5, quantity = 100

// Modify
item.setQuantity(95);

// Save (will check version)
repository.save(item);  // Updates version to 6
```

### Thread B (Concurrent)
```java
// Read same item with version 5
InventoryItem item = repository.findById("item-1").get();
// version = 5, quantity = 100

// Modify
item.setQuantity(110);

// Try to save - FAILS!
repository.save(item);  // OptimisticLockException: 
                        // Expected version 5, but database has 6
```

## Exception Handling

```java
@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl {
    
    private final InventoryItemRepository repository;
    
    @Transactional
    public InventoryItemDTO updateStock(String id, int newQuantity) {
        try {
            InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Not found"));
            
            item.setQuantity(newQuantity);
            return mapper.toDTO(repository.save(item));
            
        } catch (OptimisticLockException e) {
            throw new IllegalStateException(
                "Item was modified by another user. Please refresh and try again.", e);
        }
    }
}

// Global exception handler
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(OptimisticLockException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(
            OptimisticLockException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(
                "CONFLICT", 
                "Resource was modified. Please refresh and try again."));
    }
}
```

## Retry Logic

Client-side retry with exponential backoff:

```java
@Service
public class RetryableInventoryItemService {
    
    private static final int MAX_RETRIES = 3;
    private static final long INITIAL_WAIT = 100;  // ms
    
    @Transactional
    public InventoryItemDTO updateStockWithRetry(
            String itemId, 
            int newQuantity) {
        
        long wait = INITIAL_WAIT;
        
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                return doUpdateStock(itemId, newQuantity);
            } catch (OptimisticLockException e) {
                if (attempt == MAX_RETRIES) {
                    throw e;  // Give up after max retries
                }
                
                try {
                    Thread.sleep(wait);
                    wait *= 2;  // Exponential backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(ie);
                }
            }
        }
        
        throw new RuntimeException("Update failed after retries");
    }
    
    private InventoryItemDTO doUpdateStock(String itemId, int newQuantity) {
        InventoryItem item = repository.findById(itemId)
            .orElseThrow(() -> new NoSuchElementException("Not found"));
        
        item.setQuantity(newQuantity);
        return mapper.toDTO(repository.save(item));
    }
}
```

## When to Use

✅ **Use Optimistic Locking when:**
- Concurrent updates likely (multiple users)
- Conflicts are expected but rare
- Database locks hurt performance
- Retrying is acceptable
- No real-time guarantee needed

❌ **Use Pessimistic Locking when:**
- Conflicts must be prevented
- Performance is less critical
- Database-level control required
- Real-time consistency essential

---

[⬅️ Back to Layers Overview](./index.md)
