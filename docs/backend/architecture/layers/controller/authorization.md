[⬅️ Back to Controller Index](./index.md)

# Authentication & Authorization

The **Authentication & Authorization** responsibility ensures only authorized users can access endpoints using Spring Security integration.

## Authorization Annotations

- `@PreAuthorize` - Method-level authorization checks evaluated before method execution
- `isAuthenticated()` - Verify user is logged in
- `hasRole('ADMIN')`, `hasRole('USER')` - Check user roles
- `permitAll()` - Allow unauthenticated access

## Authorization Examples

### Check Authentication Status

```java
@PreAuthorize("isAuthenticated()")
@GetMapping
public ResponseEntity<List<SupplierDTO>> listAll() {
    return ResponseEntity.ok(supplierService.findAll());
}
```

### Check User Role

```java
@PreAuthorize("hasRole('ADMIN')")
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
    return ResponseEntity.ok(supplierService.create(dto));
}
```

### Allow Read-Only Access in Demo Mode

```java
@PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
@GetMapping("/{id}")
public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
    return supplierService.findById(id)
        .map(ResponseEntity::ok)
        .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
}
```

### Restrict Modifications to Admins

```java
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) {
    supplierService.delete(id);
    return ResponseEntity.noContent().build();
}
```

## Role Levels

- **USER** - Standard authenticated user, can read most data
- **ADMIN** - Full access, can create/update/delete resources

## User Roles in Practice

```java
// Anyone can read (if authenticated or demo mode)
@PreAuthorize("isAuthenticated()")
@GetMapping
public ResponseEntity<List<SupplierDTO>> listAll() { ... }

// Only ADMIN can create
@PreAuthorize("hasRole('ADMIN')")
@PostMapping
public ResponseEntity<SupplierDTO> create(...) { ... }

// Only ADMIN can delete
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(...) { ... }
```

---

[⬅️ Back to Controller Index](./index.md)
