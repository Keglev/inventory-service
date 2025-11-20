[⬅️ Back to Validation Index](./index.html)

# JSR-380 Bean Validation Constraints

## Overview

**JSR-380 (Jakarta Validation)** provides declarative, annotation-based constraints for field-level validation. Smart Supply Pro uses JSR-380 constraints extensively in DTOs to enforce basic data integrity rules automatically.

---

## Jakarta Validation Integration

### Automatic Validation in Controllers

```java
@PostMapping
public ResponseEntity<InventoryItemDTO> create(
    @Valid @RequestBody InventoryItemDTO dto  // ← JSR-380 triggered by Spring
) {
    // If constraints violated, MethodArgumentNotValidException thrown
    // Caught by GlobalExceptionHandler → 400 Bad Request
    return ResponseEntity.ok(service.create(dto));
}
```

**How it works:**
1. Spring receives @Valid annotation
2. Spring instantiates Jakarta Validator
3. Validator checks all @Constraint annotations on DTO fields
4. If any constraint fails, MethodArgumentNotValidException raised
5. GlobalExceptionHandler formats as 400 Bad Request

---

## Common Constraints

### String Constraints

#### @NotNull
```java
@NotNull(message = "Price is mandatory")
private BigDecimal price;
```
- Field cannot be null
- Different from @NotBlank (blank = null or empty string)
- Use for: Objects, wrappers (Integer, BigDecimal)

#### @NotBlank
```java
@NotBlank(message = "Item name is mandatory")
private String name;
```
- String cannot be null or contain only whitespace
- Trims spaces before checking
- Use for: Required strings (names, IDs, descriptions)

#### @NotEmpty
```java
@NotEmpty(message = "Collection cannot be empty")
private List<String> tags;
```
- Collection/String cannot be null or empty
- More flexible than @NotBlank
- Use for: Lists, sets, maps, arrays

#### @Email
```java
@Email(message = "Invalid email format")
private String email;
```
- Field must be valid email address
- Pattern: user@domain.ext
- Use for: Email fields in SupplierDTO

#### @Pattern
```java
@Pattern(regexp = "^[A-Z]{3}-\\d{3}$", message = "Invalid supplier code")
private String supplierCode;
```
- String must match regex pattern
- Supports custom error messages
- Use for: Formatted codes, phone numbers, etc.

---

### Numeric Constraints

#### @Positive
```java
@Positive(message = "Price must be greater than zero")
private BigDecimal price;
```
- Number must be > 0 (strictly positive)
- Works with: Integer, Long, BigDecimal, Double, Float
- Use for: Prices, quantities that must be nonzero

#### @PositiveOrZero
```java
@PositiveOrZero(message = "Quantity must be zero or positive")
private Integer quantity;
```
- Number must be >= 0
- Allows zero (unlike @Positive)
- Use for: Stock quantities, counts that can be zero

#### @Negative
```java
@Negative
private Integer delta;
```
- Number must be < 0 (strictly negative)
- Inverse of @Positive

#### @NegativeOrZero
```java
@NegativeOrZero
private Integer adjustment;
```
- Number must be <= 0
- Inverse of @PositiveOrZero

#### @Min / @Max
```java
@Min(value = 1, message = "Quantity must be at least 1")
private Integer quantity;

@Max(value = 999, message = "Quantity cannot exceed 999")
private Integer quantity;
```
- Number must be between bounds (inclusive)
- Works with: Long, Integer, BigDecimal

---

### Collection/Array Constraints

#### @Size
```java
@Size(min = 1, max = 50, message = "Name must be 1-50 characters")
private String name;

@Size(min = 0, max = 100, message = "Items must be 0-100")
private List<InventoryItem> items;
```
- Collection/String length must be within bounds
- min = minimum size (default 0)
- max = maximum size (default Integer.MAX_VALUE)
- Use for: Names, descriptions, lists

---

### Null/Non-Null Constraints

#### @Null
```java
@Null(message = "ID must be absent when creating", groups = Create.class)
private String id;
```
- Field must be null
- Useful in validation groups (see below)
- Use for: Auto-generated IDs on creation (should be null)

#### @NotNull
```java
@NotNull(message = "ID is required")
private String id;
```
- Field must not be null
- Use for: Required identifiers on updates

---

## InventoryItemDTO Constraints

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItemDTO {
    
    // Validation groups for create vs update
    public interface Create {}
    public interface Update {}

    /** ID must be null when creating, present when updating. */
    @Null(message = "ID must be absent when creating", groups = Create.class)
    private String id;

    /** Display name - required and non-blank. */
    @NotBlank(message = "Item name is mandatory")
    private String name;

    /** Stock quantity - required and non-negative. */
    @NotNull(message = "Quantity is mandatory")
    @PositiveOrZero(message = "Quantity must be zero or positive")
    private Integer quantity;

    /** Price per unit - required and positive. */
    @NotNull(message = "Price is mandatory")
    @Positive(message = "Price must be greater than zero")
    private BigDecimal price;

    /** Total value (calculated, not from client). */
    private BigDecimal totalValue;

    /** Supplier reference - required. */
    @NotBlank(message = "Supplier ID is mandatory")
    private String supplierId;

    /** Audit trail - who created this item. */
    private String createdBy;

    /** Audit timestamp. */
    private LocalDateTime createdAt;
}
```

**Constraint Summary:**
| Field | Constraints | Meaning |
|-------|-----------|---------|
| `id` | @Null (Create) | Must be null on create |
| `name` | @NotBlank | Required string |
| `quantity` | @NotNull, @PositiveOrZero | Required, >= 0 |
| `price` | @NotNull, @Positive | Required, > 0 |
| `supplierId` | @NotBlank | Required string |
| `createdBy` | (none) | Optional, set by service |
| `createdAt` | (none) | Auto-generated, set by service |

---

## SupplierDTO Constraints

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDTO {

    /** System-generated identifier. */
    private String id;

    /** Supplier name - required and non-blank. */
    @NotBlank(message = "Name is required")
    private String name;

    /** Contact person name - optional. */
    private String contactName;

    /** Phone number - optional. */
    private String phone;

    /** Email address - optional but validated if provided. */
    @Email(message = "Invalid email format")
    private String email;

    /** Audit trail - who created this supplier. */
    @NotBlank(message = "CreatedBy must be provided")
    private String createdBy;

    /** Creation timestamp - auto-generated. */
    private LocalDateTime createdAt;
}
```

**Constraint Summary:**
| Field | Constraints | Meaning |
|-------|-----------|---------|
| `name` | @NotBlank | Required |
| `email` | @Email | Optional, validated if present |
| `createdBy` | @NotBlank | Required, provided by auth context |

---

## StockHistoryDTO Constraints

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockHistoryDTO {

    /** Item being adjusted. */
    @NotBlank(message = "Item ID cannot be null or empty")
    private String itemId;

    /** Quantity change (positive/negative/zero). */
    @NotNull(message = "Change value is required")
    private Integer change;

    /** Reason for change (validated by StockHistoryValidator). */
    @NotBlank(message = "Reason is required")
    private String reason;

    /** Price at time of change. */
    private BigDecimal priceAtChange;

    /** Audit trail. */
    @NotBlank(message = "CreatedBy must be provided")
    private String createdBy;

    /** Creation timestamp. */
    private LocalDateTime createdAt;
}
```

---

## Validation Groups Example

### Two-Operation Pattern

```java
public class InventoryItemDTO {
    
    // Marker interfaces for validation groups
    public interface Create {}
    public interface Update {}

    // ID: null on create, present on update
    @Null(message = "ID must be absent", groups = Create.class)
    @NotNull(message = "ID is required", groups = Update.class)
    private String id;

    // Name: always required
    @NotBlank(groups = {Create.class, Update.class})
    private String name;

    // Version: only validated on update (for optimistic locking)
    @NotNull(groups = Update.class)
    private Long version;
}
```

**Usage in controllers:**

```java
@PostMapping
public ResponseEntity<InventoryItemDTO> create(
    @Validated(Create.class) @RequestBody InventoryItemDTO dto
) {
    // Only Create group constraints checked
    // id must be null
    return ResponseEntity.ok(service.create(dto));
}

@PutMapping("/{id}")
public ResponseEntity<InventoryItemDTO> update(
    @PathVariable String id,
    @Validated(Update.class) @RequestBody InventoryItemDTO dto
) {
    // Only Update group constraints checked
    // id must be non-null, version must exist
    return ResponseEntity.ok(service.update(id, dto));
}
```

---

## Error Response Format

### JSR-380 Violation Response

**Request (missing price):**
```json
POST /api/inventory
{
  "name": "Widget A",
  "quantity": 100
}
```

**Response (400 Bad Request):**
```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "timestamp": "2024-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "price Price must be greater than zero",
  "path": "/api/inventory"
}
```

**Message format:** `{fieldName} {constraint message}`

### Multiple Constraint Violations

**Request (quantity negative, price zero):**
```json
POST /api/inventory
{
  "name": "Widget A",
  "quantity": -5,
  "price": 0
}
```

**Response (returns first violation):**
```json
HTTP/1.1 400 Bad Request
{
  "message": "quantity Quantity must be zero or positive"
}
```

Note: GlobalExceptionHandler returns **first** violation found. To return all violations, customize exception handler.

---

## Custom Constraints (Advanced)

If JSR-380 constraints don't cover your use case, create custom constraints:

```java
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PositiveDecimalValidator.class)
public @interface PositiveDecimal {
    String message() default "Decimal value must be positive";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    int scale() default 2;  // Decimal places
}

public class PositiveDecimalValidator implements ConstraintValidator<PositiveDecimal, BigDecimal> {
    @Override
    public boolean isValid(BigDecimal value, ConstraintValidatorContext context) {
        if (value == null) return true;  // @NotNull checks null
        return value.signum() > 0;  // Must be positive
    }
}
```

**Usage:**
```java
@PositiveDecimal(message = "Price must be positive with 2 decimal places")
private BigDecimal price;
```

---

## Best Practices

### 1. Use Specific Constraints
```java
// ✅ Good: Specific constraints
@NotBlank(message = "Name is required")
private String name;

@Positive(message = "Price must be greater than zero")
private BigDecimal price;

// ❌ Avoid: Generic @NotNull for everything
@NotNull(message = "Name")
private String name;
```

### 2. Provide Clear Messages
```java
// ✅ Good: Clear, actionable messages
@NotBlank(message = "Supplier name is mandatory and cannot be empty")
private String name;

// ❌ Avoid: Generic or vague messages
@NotBlank(message = "Invalid")
private String name;
```

### 3. Use Validation Groups for Different Operations
```java
// ✅ Good: Separate validation for create/update
public interface Create {}
public interface Update {}

@Null(groups = Create.class)
private String id;

@NotNull(groups = Update.class)
private String id;

// ❌ Avoid: One-size-fits-all validation
private String id;
```

### 4. Combine Constraints When Needed
```java
// ✅ Good: Multiple constraints for complete validation
@NotNull
@PositiveOrZero
@Max(value = 10000)
private Integer quantity;

// ❌ Avoid: Single constraint insufficient
@NotNull
private Integer quantity;
```

---

## Testing JSR-380 Constraints

### Unit Test Example

```java
@SpringBootTest
class InventoryItemDTOValidationTest {

    @Autowired
    private Validator validator;

    @Test
    void testNameIsRequired() {
        InventoryItemDTO dto = InventoryItemDTO.builder()
            .name("")  // Blank name
            .quantity(100)
            .price(BigDecimal.TEN)
            .supplierId("SUPP-001")
            .build();

        Set<ConstraintViolation<InventoryItemDTO>> violations = validator.validate(dto);
        
        assertThat(violations).isNotEmpty();
        assertThat(violations).anyMatch(v -> 
            v.getPropertyPath().toString().equals("name"));
    }

    @Test
    void testPriceCannotBeZero() {
        InventoryItemDTO dto = InventoryItemDTO.builder()
            .name("Widget")
            .quantity(100)
            .price(BigDecimal.ZERO)  // Zero price
            .supplierId("SUPP-001")
            .build();

        Set<ConstraintViolation<InventoryItemDTO>> violations = validator.validate(dto);
        
        assertThat(violations).isNotEmpty()
            .anyMatch(v -> v.getMessage().contains("greater than zero"));
    }
}
```

---

## Related Documentation

- **[Validation Index](./index.html)** - Multi-layer validation framework overview
- **[Custom Validators](./custom-validators.html)** - Domain-specific validation logic
- **[Exception Handling](./exception-handling.html)** - Error response mapping
- **[Validation Patterns](./patterns.html)** - Best practices

---

[⬅️ Back to Validation Index](./index.html)
