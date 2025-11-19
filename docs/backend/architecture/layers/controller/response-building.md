[⬅️ Back to Controller Index](./index.md)

# Response Building

The **Response Building** responsibility constructs proper HTTP responses with appropriate status codes.

## HTTP Status Codes

- `200 OK` - Successful retrieval
- `201 CREATED` - Successful resource creation
- `204 NO CONTENT` - Successful deletion or update without response body
- `400 BAD REQUEST` - Invalid input (validation failed)
- `401 UNAUTHORIZED` - User not authenticated
- `403 FORBIDDEN` - User not authorized
- `404 NOT FOUND` - Resource not found
- `409 CONFLICT` - Business rule violation

## Response Status Code Examples

### GET - Successful Retrieval

```java
@GetMapping("/{id}")
public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
    return supplierService.findById(id)
        .map(ResponseEntity::ok)  // 200 OK
        .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
}
```

### POST - Resource Creation with Location Header

```java
@PostMapping
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
    SupplierDTO created = supplierService.create(dto);
    
    // Build Location header pointing to created resource
    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}")
        .buildAndExpand(created.getId())
        .toUri();
    
    return ResponseEntity.created(location).body(created);  // 201 CREATED + Location
}
```

**HTTP Response:**
```http
HTTP/1.1 201 Created
Location: /api/suppliers/abc123
Content-Type: application/json

{
    "id": "abc123",
    "name": "ACME Corp",
    "contactName": "John Doe",
    ...
}
```

### PUT - Update Success

```java
@PutMapping("/{id}")
public ResponseEntity<SupplierDTO> update(
        @PathVariable String id,
        @Valid @RequestBody UpdateSupplierDTO dto) {
    
    SupplierDTO updated = supplierService.update(id, dto);
    return ResponseEntity.ok(updated);  // 200 OK
}
```

### DELETE - No Content

```java
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable String id) {
    supplierService.delete(id);
    return ResponseEntity.noContent().build();  // 204 NO CONTENT
}
```

## List with Pagination

```java
@GetMapping
public ResponseEntity<Page<SupplierDTO>> listAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
    
    Page<SupplierDTO> suppliers = supplierService.findAll(
        PageRequest.of(page, size)
    );
    
    return ResponseEntity.ok(suppliers);  // 200 OK with paginated results
}
```

---

[⬅️ Back to Controller Index](./index.md)
