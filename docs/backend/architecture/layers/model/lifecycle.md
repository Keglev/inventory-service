[⬅️ Back to Model Index](./index.md)

# Model Lifecycle

The **Model Lifecycle** describes the states an entity passes through from creation to deletion.

## Entity Lifecycle States

```mermaid
graph TB
    New["New Entity<br/>Created in Code"]
    Transient["Transient State<br/>Not Yet Persisted"]
    Managed["Managed State<br/>Tracked by Hibernate"]
    Persistent["Persistent<br/>Saved to Database"]
    Detached["Detached State<br/>Transaction Ended"]
    Removed["Removed<br/>Marked for Delete"]
    Deleted["Deleted<br/>from Database"]

    New --> Transient
    Transient -->|repository.save()| Managed
    Managed -->|Transaction Commits| Persistent
    Persistent -->|Transaction Ends| Detached
    Persistent -->|repository.delete()| Removed
    Removed -->|Commit| Deleted

    style New fill:#bbdefb
    style Transient fill:#90caf9
    style Managed fill:#64b5f6
    style Persistent fill:#42a5f5
    style Detached fill:#2196f3
    style Removed fill:#ef9a9a
    style Deleted fill:#ef5350
```

## State Descriptions

### 1. New Entity (Transient)
**Created in code but not yet persisted**

```java
Supplier supplier = Supplier.builder()
    .id(UUID.randomUUID().toString())
    .name("ACME Corp")
    .build();
// supplier is NEW/TRANSIENT - not yet in database
```

### 2. Managed State
**Entity is tracked by Hibernate and associated with session**

```java
Supplier saved = repository.save(supplier);
// saved is now MANAGED - within active session
// Changes are tracked automatically
```

### 3. Persistent
**Entity saved to database with committed transaction**

```java
// After @Transactional method completes
// Entity is PERSISTENT - record exists in database
// Changes are persisted
```

### 4. Detached State
**Entity no longer tracked after session closes**

```java
// After @Transactional method ends
// Entity becomes DETACHED - session closed
// Changes are NO LONGER tracked automatically

supplier.setName("New Name");  // Won't be persisted
// Must reattach or save explicitly
```

### 5. Removed
**Entity marked for deletion**

```java
repository.delete(supplier);
// supplier is REMOVED - scheduled for deletion
```

### 6. Deleted
**Entity removed from database**

```java
// After @Transactional completes
// supplier is DELETED - removed from database
// Record no longer exists
```

## Lifecycle Transitions

### Save New Entity

```
New → Transient → Managed → Persistent
```

```java
Supplier supplier = new Supplier();  // NEW
supplier.setName("ACME Corp");

repository.save(supplier);            // MANAGED (within session)

// @Transactional ends → PERSISTENT (committed to database)
```

### Update Managed Entity

```
Managed → Managed (automatically persisted on commit)
```

```java
@Transactional
public void updateSupplier(String id, String newName) {
    Supplier supplier = repository.findById(id);  // MANAGED
    supplier.setName(newName);
    // No need to call save() - automatically persisted on commit
}
```

### Update Detached Entity

```
Detached → Managed → Persistent (requires reattachment)
```

```java
Supplier supplier = repository.findById(id);  // PERSISTENT
// Detach from session somehow...

// Now DETACHED - changes won't be persisted
supplier.setName("New Name");

// Reattach via save or merge
repository.save(supplier);  // MANAGED again, then PERSISTENT
```

### Delete Entity

```
Managed → Removed → Deleted
```

```java
Supplier supplier = repository.findById(id);  // MANAGED
repository.delete(supplier);                  // REMOVED
// @Transactional ends → DELETED (committed deletion)
```

## Practical Implications

### Why State Matters

**Managed State:**
```java
@Transactional
public void updateSupplier(String id, String newName) {
    Supplier supplier = repository.findById(id);  // MANAGED
    supplier.setName(newName);
    // No explicit save() needed - automatically persisted
}
```

**Detached State:**
```java
public void updateSupplier(String id, String newName) {
    Supplier supplier = repository.findById(id);  // DETACHED (no @Transactional)
    supplier.setName(newName);
    // Changes NOT persisted - session already closed
    
    // Must explicitly save
    repository.save(supplier);  // Reattaches and persists
}
```

## Best Practice: Use @Transactional

```java
// ✅ Good - Explicit transaction boundary
@Transactional
public SupplierDTO update(String id, UpdateSupplierDTO dto) {
    Supplier supplier = repository.findById(id);  // MANAGED
    supplier.setName(dto.getName());
    // Auto-persisted on commit - clean and simple
    return mapper.toDTO(supplier);
}

// ❌ Bad - Detached entity issues
public SupplierDTO update(String id, UpdateSupplierDTO dto) {
    Supplier supplier = repository.findById(id);  // DETACHED
    supplier.setName(dto.getName());
    // Changes NOT persisted - forgotten save?
    return mapper.toDTO(supplier);
}
```

---

[⬅️ Back to Model Index](./index.md)
