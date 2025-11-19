[⬅️ Back to Controller Index](./index.md)

# DTO Conversion (Outbound)

The **Outbound DTO Conversion** responsibility converts domain objects to DTOs for JSON response serialization.

## Outbound Conversion

Service returns domain DTOs which are serialized to JSON:

- Service returns typed DTO object
- Controller wraps in ResponseEntity
- Spring calls Jackson serializer
- DTO → JSON string conversion
- JSON response sent to client

## Jackson Serialization

**Benefits:**
- Only API-relevant fields are exposed
- Sensitive internal fields excluded
- Customizable serialization logic
- Clean API contracts

## Outbound Conversion Example

```java
@GetMapping("/{id}")
public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
    return supplierService.findById(id)
        .map(ResponseEntity::ok)  // Wraps DTO in 200 OK response
        .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
}
```

**Processing Flow:**
```
Service returns SupplierDTO
    ↓
.map(ResponseEntity::ok)  ← Wraps in ResponseEntity<SupplierDTO>
    ↓
Jackson ObjectMapper serializes DTO
    ↓
DTO → JSON String conversion
    ↓
HTTP Response with 200 status + JSON body
```

## Complex Object Example

```java
@GetMapping
public ResponseEntity<Page<SupplierDTO>> listAll(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
    
    Page<SupplierDTO> suppliers = supplierService.findAll(
        PageRequest.of(page, size, Sort.by("name").ascending())
    );
    
    return ResponseEntity.ok(suppliers);
}
```

**JSON Response:**
```json
{
    "content": [
        {
            "id": "123",
            "name": "ACME Corp",
            "contactName": "John Doe",
            "contactEmail": "john@acme.com",
            "createdAt": "2024-11-19T10:30:45"
        }
    ],
    "pageable": {
        "pageNumber": 0,
        "pageSize": 20,
        "totalElements": 100,
        "totalPages": 5
    }
}
```

---

[⬅️ Back to Controller Index](./index.md)
