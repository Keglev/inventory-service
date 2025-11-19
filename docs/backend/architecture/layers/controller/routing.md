[⬅️ Back to Controller Index](./index.md)

# Request Routing

The **Request Routing** responsibility maps HTTP endpoints to controller methods using Spring annotations.

## HTTP Method Annotations

- `@GetMapping` - Retrieve resources (HTTP GET)
- `@PostMapping` - Create resources (HTTP POST)
- `@PutMapping` - Update resources (HTTP PUT)
- `@DeleteMapping` - Delete resources (HTTP DELETE)
- `@RequestMapping` - Base path configuration

## Routing Example

```java
@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {
    
    @GetMapping
    public ResponseEntity<List<SupplierDTO>> listAll() {
        return ResponseEntity.ok(supplierService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
        return supplierService.findById(id)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
    }
    
    @PostMapping
    public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
        SupplierDTO created = supplierService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<SupplierDTO> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateSupplierDTO dto) {
        return ResponseEntity.ok(supplierService.update(id, dto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

## Path Variables

Extract values from URL path:

```java
@GetMapping("/api/suppliers/{id}")
public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
    return supplierService.findById(id)
        .map(ResponseEntity::ok)
        .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
}
```

## Query Parameters

Extract values from query string:

```java
@GetMapping("/api/suppliers/search")
public ResponseEntity<List<SupplierDTO>> search(
        @RequestParam String name,
        @RequestParam(required = false) String city) {
    return ResponseEntity.ok(supplierService.search(name, city));
}
// Usage: GET /api/suppliers/search?name=ACME&city=Boston
```

---

[⬅️ Back to Controller Index](./index.md)
