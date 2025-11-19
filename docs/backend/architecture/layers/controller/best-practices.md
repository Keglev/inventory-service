[⬅️ Back to Controller Index](./index.md)

# Best Practices

Guidelines and standards for effective controller development.

## 1. Lean Controllers

Controllers should only handle HTTP concerns. Complex business logic belongs in the service layer.

```java
// ✅ Good - Controller delegates to service
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
    return ResponseEntity.ok(supplierService.create(dto));
}

// ❌ Bad - Business logic in controller
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
    if (dto.getName().contains("BadWord")) {
        throw new IllegalArgumentException("Invalid name");
    }
    if (repository.existsByName(dto.getName())) {
        throw new IllegalStateException("Duplicate");
    }
    // ... more business logic here ...
}
```

## 2. Consistent Response Structure

All endpoints return `ResponseEntity<DTO>` for consistent response handling and status code control.

```java
// ✅ Good - Consistent ResponseEntity wrapping
@GetMapping("/{id}")
public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
    return supplierService.findById(id)
        .map(ResponseEntity::ok)
        .orElseThrow(() -> new NoSuchElementException("Not found"));
}

// ❌ Bad - Inconsistent return types
@GetMapping("/{id}")
public SupplierDTO getById(@PathVariable String id) {
    return supplierService.findById(id).orElse(null);
}
```

## 3. Security-First Authorization

Always use `@PreAuthorize` for sensitive operations. Never assume user is authorized.

```java
// ✅ Good - Explicit authorization check
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) {
    supplierService.delete(id);
    return ResponseEntity.noContent().build();
}

// ❌ Bad - No authorization check
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) {
    supplierService.delete(id);
    return ResponseEntity.noContent().build();
}
```

## 4. Validation at Boundary

Use `@Valid` on all user-submitted data. Never trust client input.

```java
// ✅ Good - Validates at API boundary
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
    // dto is guaranteed to be valid here
    return ResponseEntity.ok(supplierService.create(dto));
}

// ❌ Bad - No validation annotation
@PostMapping
public ResponseEntity<SupplierDTO> create(@RequestBody CreateSupplierDTO dto) {
    // Could receive invalid data
    return ResponseEntity.ok(supplierService.create(dto));
}
```

## 5. Proper HTTP Status Codes

Use semantically correct status codes:

```java
// ✅ Good - Semantically correct
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
    SupplierDTO created = supplierService.create(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);  // 201
}

@PutMapping("/{id}")
public ResponseEntity<SupplierDTO> update(@PathVariable String id, ...) {
    SupplierDTO updated = supplierService.update(id, ...);
    return ResponseEntity.ok(updated);  // 200
}

@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) {
    supplierService.delete(id);
    return ResponseEntity.noContent().build();  // 204
}

// ❌ Bad - Wrong status codes
@PostMapping
public ResponseEntity<SupplierDTO> create(...) {
    return ResponseEntity.ok(supplierService.create(...));  // 200 instead of 201
}
```

## 6. Location Header on Creation

When creating resources, return Location header pointing to created resource.

```java
// ✅ Good - Location header included
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
    SupplierDTO created = supplierService.create(dto);
    
    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}")
        .buildAndExpand(created.getId())
        .toUri();
    
    return ResponseEntity.created(location).body(created);
}

// Result:
// HTTP/1.1 201 Created
// Location: /api/suppliers/abc123
// Content-Type: application/json
// { "id": "abc123", ... }

// ❌ Bad - No Location header
@PostMapping
public ResponseEntity<SupplierDTO> create(...) {
    return ResponseEntity.ok(supplierService.create(...));
}
```

---

[⬅️ Back to Controller Index](./index.md)
