[⬅️ Back to Controller Index](./index.md)

# Integration with Other Layers

The **Integration** responsibility describes how the Controller Layer connects to downstream layers in the application.

## Layered Architecture Integration

```
Controller Layer (You are here)
       ↓
Service Layer (Business Logic)
       ↓
Repository Layer (Data Access)
       ↓
Database
```

## Interaction Pattern

### 1. Controller Receives Request

```java
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
    // Request received, DTO validated
```

### 2. Controller Delegates to Service

The controller calls service methods but never implements business logic:

```java
    // NO business logic here
    SupplierDTO created = supplierService.create(dto);  // Delegate
```

### 3. Service Performs Validation

The service layer validates business rules:

```java
// In SupplierService
@Transactional
public SupplierDTO create(CreateSupplierDTO dto) {
    // Business validation
    supplierValidator.validateRequiredFields(dto);
    supplierValidator.validateUniquenessOnCreate(dto.getName());
    
    // Convert DTO → Entity
    Supplier entity = mapper.toEntity(dto);
```

### 4. Service Calls Repository

The service persists data via repository methods:

```java
    // Persist to database
    Supplier saved = repository.save(entity);
    
    // Return DTO to controller
    return mapper.toDTO(saved);
}
```

### 5. Controller Builds HTTP Response

The controller receives the result and wraps it in a response:

```java
    // Build HTTP response
    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}")
        .buildAndExpand(created.getId())
        .toUri();
    
    return ResponseEntity.created(location).body(created);  // 201 CREATED
}
```

## Data Flow Diagram

```
Client (JSON)
    ↓
Controller
    ├─ Receives HTTP request
    ├─ Validates with @Valid
    ├─ Checks authorization with @PreAuthorize
    └─ Delegates to service
    ↓
Service Layer
    ├─ Validates business rules
    ├─ Transforms DTO → Entity
    ├─ Calls repository
    └─ Transforms Entity → DTO
    ↓
Repository Layer
    ├─ Executes SQL/JPQL queries
    └─ Returns entities
    ↓
Database
    └─ Persists/retrieves data
    ↑
Entity is returned through layers
    ↓
Controller (DTO)
    └─ Returns HTTP response (JSON)
```

## Responsibility Boundaries

**Controller DOES:**
- ✅ Handle HTTP concerns (routing, status codes)
- ✅ Validate input with `@Valid`
- ✅ Check authorization with `@PreAuthorize`
- ✅ Convert DTO ↔ JSON
- ✅ Call service methods

**Controller DOES NOT:**
- ❌ Implement business logic
- ❌ Access repositories directly
- ❌ Connect to databases
- ❌ Validate business rules
- ❌ Manage transactions

**Service DOES:**
- ✅ Implement business logic
- ✅ Validate business rules
- ✅ Manage transactions
- ✅ Call repositories
- ✅ Handle exceptions

**Repository DOES:**
- ✅ Execute database queries
- ✅ Manage entities
- ✅ Handle pagination/sorting
- ✅ Translate to domain exceptions

---

[⬅️ Back to Controller Index](./index.md)
