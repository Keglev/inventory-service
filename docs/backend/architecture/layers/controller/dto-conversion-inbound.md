[⬅️ Back to Controller Index](./index.md)

# DTO Conversion (Inbound)

The **Inbound DTO Conversion** responsibility converts incoming JSON to Data Transfer Objects (DTOs) automatically via Jackson.

## Inbound Conversion

HTTP request bodies are automatically deserialized from JSON to DTOs:

- HTTP request body is JSON string
- Spring calls Jackson deserializer
- JSON → DTO object mapping
- Field validation applied (if `@Valid` annotation present)
- DTO passed to controller method

## Jackson Deserialization

**Benefits:**
- Decouples API contract from internal domain models
- Enables API versioning and forward compatibility
- Only API-relevant fields are mapped
- Type safety at compile time

## Inbound Conversion Example

```java
@PostMapping
public ResponseEntity<SupplierDTO> create(
    @Valid @RequestBody CreateSupplierDTO dto  // Jackson deserializes JSON → DTO
) {
    // dto is now a typed Java object with validated fields
    SupplierDTO created = supplierService.create(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}
```

**HTTP Request:**
```http
POST /api/suppliers
Content-Type: application/json

{
    "name": "ACME Corp",
    "contactName": "John Doe",
    "contactEmail": "john@acme.com",
    "phoneNumber": "5551234567",
    "minOrderQuantity": 10
}
```

**Jackson Processing:**
```
JSON String
    ↓
Jackson ObjectMapper
    ↓
@NotBlank validation on fields
    ↓
CreateSupplierDTO object (strongly typed)
    ↓
Controller method executes
```

## DTO Annotations for Deserialization

```java
@Data
@Builder
public class CreateSupplierDTO {
    
    @JsonProperty("name")  // Optional: explicit JSON field name
    @NotBlank
    private String name;
    
    @JsonIgnore  // Optional: exclude field from deserialization
    private String internalField;
    
    @JsonFormat(pattern = "yyyy-MM-dd")  // Optional: date format
    private LocalDate createdDate;
}
```

---

[⬅️ Back to Controller Index](./index.md)
