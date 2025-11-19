[⬅️ Back to Controller Index](./index.md)

# Request Validation

The **Request Validation** responsibility ensures data integrity at the API boundary using Spring's validation framework.

## Validation Annotations

- `@Valid` - Triggers validation of nested DTO fields
- `@NotNull` - Field must not be null
- `@NotBlank` - String must not be empty or whitespace
- `@Email` - Field must be valid email format
- `@Min`, `@Max` - Numeric range validation
- `@Pattern` - Regex pattern matching
- `@Size` - Collection or string length validation

## Validation Example

```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) {
    // @Valid ensures all DTO fields meet constraints before method execution
    return ResponseEntity.ok(supplierService.create(dto));
}
```

## DTO with Validation Constraints

```java
@Data
@Builder
public class CreateSupplierDTO {
    
    @NotBlank(message = "Supplier name is required")
    @Size(min = 3, max = 100, message = "Name must be 3-100 characters")
    private String name;
    
    @NotBlank(message = "Contact name is required")
    private String contactName;
    
    @Email(message = "Contact email must be valid")
    private String contactEmail;
    
    @NotBlank
    @Pattern(regexp = "\\d{10}", message = "Phone must be 10 digits")
    private String phoneNumber;
    
    @Min(value = 0, message = "Min order quantity must be 0 or greater")
    private Integer minOrderQuantity;
}
```

## Validation Flow

```
HTTP Request with DTO
       ↓
Controller receives @Valid annotation
       ↓
Spring runs constraint validators
       ↓
Are all constraints satisfied?
       ├─ No → Throw MethodArgumentNotValidException
       │        ↓
       │    GlobalExceptionHandler catches
       │        ↓
       │    Returns 400 Bad Request with error details
       │
       └─ Yes → Controller method executes
                 ↓
            Service receives validated DTO
```

---

[⬅️ Back to Controller Index](./index.md)
