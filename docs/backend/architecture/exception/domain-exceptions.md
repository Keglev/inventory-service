# Domain Exceptions

**Status**: Complete | **Last Updated**: 2025-11-20 | **Version**: 1.0.0

**Back to**: [Exception Architecture Index](./index.md) | [Architecture Overview](../index.md)

---

## Overview

Domain exceptions are **custom, application-specific exceptions** that represent business logic violations and domain-level errors. Unlike framework exceptions (handled by Spring automatically), domain exceptions are **thrown explicitly by service layer code** to enforce business rules and maintain application invariants.

**Key Characteristics**:
- ✅ Extend RuntimeException (unchecked)
- ✅ Thrown explicitly from service/business logic
- ✅ Carry contextual information (resource type, conflict details, etc.)
- ✅ Handled by BusinessExceptionHandler (priority over framework)
- ✅ Support factory methods for common scenarios
- ✅ Include structured error details for API responses

---

## Exception Hierarchy

```
RuntimeException
├── InvalidRequestException
│   ├── requiredField(fieldName)
│   ├── invalidFormat(fieldName, format)
│   ├── valueOutOfRange(fieldName, min, max)
│   ├── businessRuleViolation(rule)
│   └── securityViolation(issue)
│
├── DuplicateResourceException
│   ├── supplierName(name)
│   ├── inventoryItemSku(sku)
│   └── inventoryItemName(name)
│
└── IllegalStateException
    └── Standard Java exception (not custom)
    └── Thrown for business state violations
```

---

## Exception 1: InvalidRequestException

### Purpose

**InvalidRequestException** represents **business validation failures** at the application level. It's thrown when user input or business data violates domain constraints, business rules, or security policies.

**Use Cases**:
- Required field is missing
- Value is outside acceptable range
- Business rule is violated
- Security policy is violated
- Input format is invalid

### Class Implementation

```java
public class InvalidRequestException extends RuntimeException {
    
    private final ValidationSeverity severity;
    private final String validationCode;
    private final Map<String, String> fieldErrors;
    private final List<String> generalErrors;

    /**
     * Simple constructor with message only.
     */
    public InvalidRequestException(String message) { 
        super(message);
        this.severity = ValidationSeverity.MEDIUM;
        this.validationCode = "INVALID_REQUEST";
        this.fieldErrors = new HashMap<>();
        this.generalErrors = new ArrayList<>();
    }

    /**
     * Constructor with severity and validation code.
     */
    public InvalidRequestException(String message, 
                                   ValidationSeverity severity, 
                                   String validationCode) {
        super(message);
        this.severity = severity;
        this.validationCode = validationCode;
        this.fieldErrors = new HashMap<>();
        this.generalErrors = new ArrayList<>();
    }

    /**
     * Constructor with field-specific errors.
     */
    public InvalidRequestException(String message, 
                                   Map<String, String> fieldErrors) {
        super(message);
        this.severity = ValidationSeverity.MEDIUM;
        this.validationCode = "FIELD_VALIDATION_FAILED";
        this.fieldErrors = fieldErrors != null ? new HashMap<>(fieldErrors) : new HashMap<>();
        this.generalErrors = new ArrayList<>();
    }

    // Query methods
    public ValidationSeverity getSeverity() { return severity; }
    public String getValidationCode() { return validationCode; }
    public Map<String, String> getFieldErrors() { return Map.copyOf(fieldErrors); }
    public List<String> getGeneralErrors() { return List.copyOf(generalErrors); }
    public boolean hasFieldErrors() { return !fieldErrors.isEmpty(); }
    public boolean hasGeneralErrors() { return !generalErrors.isEmpty(); }
    public int getErrorCount() { return fieldErrors.size() + generalErrors.size(); }
    public boolean isCritical() { return severity == ValidationSeverity.CRITICAL; }

    // Error details for API responses
    public Map<String, Object> getValidationDetails() {
        Map<String, Object> details = new HashMap<>();
        details.put("validationCode", validationCode);
        details.put("severity", severity.name());
        details.put("message", getMessage());
        if (hasFieldErrors()) details.put("fieldErrors", fieldErrors);
        if (hasGeneralErrors()) details.put("generalErrors", generalErrors);
        details.put("errorCount", getErrorCount());
        return details;
    }

    // Severity enum
    public enum ValidationSeverity {
        LOW,      // Minor validation issues, warnings
        MEDIUM,   // Standard validation failures (default)
        HIGH,     // Business rule violations
        CRITICAL  // Security or data integrity issues
    }
}
```

### Factory Methods

Factory methods provide convenient shortcuts for common validation scenarios:

#### requiredField(fieldName)

Throws when a required field is missing:

```java
public static InvalidRequestException requiredField(String fieldName) {
    Map<String, String> fieldErrors = Map.of(fieldName, "This field is required");
    return new InvalidRequestException(
        "Required field missing: " + fieldName, 
        fieldErrors
    );
}
```

**Usage Example**:
```java
@Service
public class SupplierService {
    public SupplierDTO createSupplier(CreateSupplierRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw InvalidRequestException.requiredField("name");
        }
    }
}
```

**HTTP Response**:
```json
{
  "error": "bad_request",
  "message": "Required field missing: name",
  "timestamp": "2025-11-20T14:30:45.123Z",
  "correlationId": "SSP-1700551445123-4891"
}
```

---

#### invalidFormat(fieldName, expectedFormat)

Throws when field value has invalid format:

```java
public static InvalidRequestException invalidFormat(String fieldName, 
                                                    String expectedFormat) {
    Map<String, String> fieldErrors = Map.of(fieldName, 
        "Invalid format. Expected: " + expectedFormat);
    return new InvalidRequestException(
        "Invalid format for field: " + fieldName, 
        fieldErrors
    );
}
```

**Usage Example**:
```java
public SupplierDTO createSupplier(CreateSupplierRequest req) {
    if (!isValidSkuFormat(req.getSku())) {
        throw InvalidRequestException.invalidFormat("sku", "XXX-YYYY-ZZZZ");
    }
}

private boolean isValidSkuFormat(String sku) {
    return sku != null && sku.matches("^[A-Z]{3}-[A-Z]{4}-[A-Z]{4}$");
}
```

**HTTP Response**:
```json
{
  "error": "bad_request",
  "message": "Invalid format for field: sku",
  "timestamp": "2025-11-20T14:30:46.234Z",
  "correlationId": "SSP-1700551446234-5902"
}
```

---

#### valueOutOfRange(fieldName, minValue, maxValue)

Throws when numeric value is outside acceptable range:

```java
public static InvalidRequestException valueOutOfRange(String fieldName, 
                                                      Object minValue, 
                                                      Object maxValue) {
    Map<String, String> fieldErrors = Map.of(fieldName, 
        String.format("Value must be between %s and %s", minValue, maxValue));
    return new InvalidRequestException(
        "Value out of range for field: " + fieldName, 
        fieldErrors
    );
}
```

**Usage Example**:
```java
public InventoryDTO createInventory(CreateInventoryRequest req) {
    final int MIN_QUANTITY = 1;
    final int MAX_QUANTITY = 999999;
    
    if (req.getQuantity() < MIN_QUANTITY || req.getQuantity() > MAX_QUANTITY) {
        throw InvalidRequestException.valueOutOfRange("quantity", 
                                                      MIN_QUANTITY, 
                                                      MAX_QUANTITY);
    }
}
```

**HTTP Response**:
```json
{
  "error": "bad_request",
  "message": "Value out of range for field: quantity",
  "timestamp": "2025-11-20T14:30:47.345Z",
  "correlationId": "SSP-1700551447345-6013"
}
```

---

#### businessRuleViolation(businessRule)

Throws when a business rule is violated:

```java
public static InvalidRequestException businessRuleViolation(String businessRule) {
    return new InvalidRequestException(
        "Business rule violation: " + businessRule,
        ValidationSeverity.HIGH,
        "BUSINESS_RULE_VIOLATION"
    );
}
```

**Usage Example**:
```java
public InventoryDTO transferInventory(Long fromSupplierId, Long toSupplierId, int quantity) {
    if (fromSupplierId.equals(toSupplierId)) {
        throw InvalidRequestException.businessRuleViolation(
            "Cannot transfer inventory from supplier to itself"
        );
    }
    
    int availableQuantity = getAvailableQuantity(fromSupplierId);
    if (quantity > availableQuantity) {
        throw InvalidRequestException.businessRuleViolation(
            String.format("Cannot transfer %d units when only %d are available", 
                         quantity, availableQuantity)
        );
    }
}
```

**HTTP Response**:
```json
{
  "error": "bad_request",
  "message": "Business rule violation: Cannot transfer inventory from supplier to itself",
  "timestamp": "2025-11-20T14:30:48.456Z",
  "correlationId": "SSP-1700551448456-7124"
}
```

---

#### securityViolation(securityIssue)

Throws when a security policy is violated (CRITICAL severity):

```java
public static InvalidRequestException securityViolation(String securityIssue) {
    return new InvalidRequestException(
        "Security validation failed: " + securityIssue,
        ValidationSeverity.CRITICAL,
        "SECURITY_VIOLATION"
    );
}
```

**Usage Example**:
```java
public UserDTO registerUser(RegisterUserRequest req) {
    if (isBlacklisted(req.getEmail())) {
        throw InvalidRequestException.securityViolation(
            "Email address is blacklisted for security reasons"
        );
    }
    
    if (containsProhibitedContent(req.getPassword())) {
        throw InvalidRequestException.securityViolation(
            "Password contains prohibited content"
        );
    }
}
```

**HTTP Response**:
```json
{
  "error": "bad_request",
  "message": "Security validation failed: Email address is blacklisted for security reasons",
  "timestamp": "2025-11-20T14:30:49.567Z",
  "correlationId": "SSP-1700551449567-8235"
}
```

---

## Exception 2: DuplicateResourceException

### Purpose

**DuplicateResourceException** represents **uniqueness constraint violations** when attempting to create a resource that already exists (duplicate email, SKU, supplier name, etc.).

**Use Cases**:
- Email/username already registered
- Product SKU already exists
- Supplier name already exists
- Unique identifier is not unique

### Class Implementation

```java
public class DuplicateResourceException extends RuntimeException {

    private final String resourceType;
    private final String duplicateValue;
    private final String conflictField;

    /**
     * Simple constructor with message only.
     */
    public DuplicateResourceException(String message) {
        super(message);
        this.resourceType = null;
        this.duplicateValue = null;
        this.conflictField = null;
    }

    /**
     * Constructor with full context information.
     */
    public DuplicateResourceException(String message, 
                                      String resourceType, 
                                      String conflictField, 
                                      String duplicateValue) {
        super(message);
        this.resourceType = resourceType;
        this.conflictField = conflictField;
        this.duplicateValue = duplicateValue;
    }

    // Query methods
    public String getResourceType() { return resourceType; }
    public String getConflictField() { return conflictField; }
    public String getDuplicateValue() { return duplicateValue; }
    public boolean hasDetailedContext() { 
        return resourceType != null && conflictField != null && duplicateValue != null; 
    }

    // User-friendly error message
    public String getClientMessage() {
        if (hasDetailedContext()) {
            return String.format("%s with %s '%s' already exists", 
                resourceType, conflictField, duplicateValue);
        }
        return getMessage() != null ? getMessage() : "Resource already exists";
    }

    // Structured error details
    public Map<String, Object> getErrorDetails() {
        Map<String, Object> details = new HashMap<>();
        details.put("errorType", "DUPLICATE_RESOURCE");
        if (hasDetailedContext()) {
            details.put("resourceType", resourceType);
            details.put("conflictField", conflictField);
            details.put("duplicateValue", duplicateValue);
        }
        details.put("message", getClientMessage());
        return details;
    }
}
```

### Factory Methods

#### supplierName(supplierName)

Throws when supplier name already exists:

```java
public static DuplicateResourceException supplierName(String supplierName) {
    return new DuplicateResourceException(
        "Supplier name already exists: " + supplierName,
        "Supplier",
        "name",
        supplierName
    );
}
```

**Usage Example**:
```java
@Service
public class SupplierService {
    public SupplierDTO createSupplier(CreateSupplierRequest req) {
        if (supplierRepository.existsByNameIgnoreCase(req.getName())) {
            throw DuplicateResourceException.supplierName(req.getName());
        }
        return supplierRepository.save(new Supplier(req));
    }
}
```

**HTTP Response**:
```json
{
  "error": "conflict",
  "message": "Supplier with name 'ACME Inc' already exists",
  "timestamp": "2025-11-20T14:30:50.678Z",
  "correlationId": "SSP-1700551450678-9346"
}
```

---

#### inventoryItemSku(sku)

Throws when inventory item SKU already exists:

```java
public static DuplicateResourceException inventoryItemSku(String sku) {
    return new DuplicateResourceException(
        "Inventory item SKU already exists: " + sku,
        "InventoryItem",
        "sku",
        sku
    );
}
```

**Usage Example**:
```java
public InventoryItemDTO createInventoryItem(CreateInventoryItemRequest req) {
    if (inventoryRepository.existsBySkuIgnoreCase(req.getSku())) {
        throw DuplicateResourceException.inventoryItemSku(req.getSku());
    }
    return inventoryRepository.save(new InventoryItem(req));
}
```

**HTTP Response**:
```json
{
  "error": "conflict",
  "message": "InventoryItem with sku 'SKU-12345' already exists",
  "timestamp": "2025-11-20T14:30:51.789Z",
  "correlationId": "SSP-1700551451789-0457"
}
```

---

#### inventoryItemName(itemName)

Throws when inventory item name already exists:

```java
public static DuplicateResourceException inventoryItemName(String itemName) {
    return new DuplicateResourceException(
        "Inventory item name already exists: " + itemName,
        "InventoryItem",
        "name",
        itemName
    );
}
```

**Usage Example**:
```java
public InventoryItemDTO createInventoryItem(CreateInventoryItemRequest req) {
    if (inventoryRepository.existsByNameIgnoreCase(req.getName())) {
        throw DuplicateResourceException.inventoryItemName(req.getName());
    }
    return inventoryRepository.save(new InventoryItem(req));
}
```

**HTTP Response**:
```json
{
  "error": "conflict",
  "message": "InventoryItem with name 'Widget A' already exists",
  "timestamp": "2025-11-20T14:30:52.890Z",
  "correlationId": "SSP-1700551452890-1568"
}
```

---

## Exception 3: IllegalStateException

### Purpose

**IllegalStateException** is a standard Java exception that represents **business state rule violations**. It's thrown when an operation is attempted in an invalid state (e.g., deleting a supplier that has active inventory, canceling a shipped order).

**Use Cases**:
- Deleting resource with dependencies
- Transitioning to invalid state
- Modifying locked/finalized resource
- Operation not allowed in current state

### Usage Examples

**Example 1: Delete with Dependencies**

```java
@Service
public class SupplierService {
    public void deleteSupplier(Long supplierId) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
        
        // Business rule: Cannot delete supplier with active inventory
        if (inventoryRepository.existsBySupplier(supplier)) {
            throw new IllegalStateException(
                "Cannot delete supplier: active inventory items exist. " +
                "Please delete all inventory items first."
            );
        }
        
        supplierRepository.delete(supplier);
    }
}
```

**HTTP Response**:
```json
{
  "error": "conflict",
  "message": "Cannot delete supplier: active inventory items exist. Please delete all inventory items first.",
  "timestamp": "2025-11-20T14:30:53.901Z",
  "correlationId": "SSP-1700551453901-2679"
}
```

---

**Example 2: Invalid State Transition**

```java
@Service
public class OrderService {
    public OrderDTO cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found"));
        
        // Business rule: Cannot cancel shipped orders
        if (order.getStatus() == OrderStatus.SHIPPED) {
            throw new IllegalStateException(
                "Cannot cancel order: already shipped. " +
                "Please contact shipping department for return options."
            );
        }
        
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException(
                "Cannot cancel order: already delivered"
            );
        }
        
        order.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }
}
```

---

**Example 3: Modifying Locked Resource**

```java
@Service
public class FinanceService {
    public FinancialRecordDTO updateFinancialRecord(Long recordId, UpdateRequest req) {
        FinancialRecord record = recordRepository.findById(recordId).orElseThrow();
        
        // Business rule: Cannot modify locked/finalized records
        if (record.isLocked()) {
            throw new IllegalStateException(
                "Cannot modify financial record: locked for audit trail preservation. " +
                "Contact finance department to unlock."
            );
        }
        
        record.update(req);
        return recordRepository.save(record);
    }
}
```

---

## BusinessExceptionHandler Integration

All domain exceptions are handled by **BusinessExceptionHandler** with high priority:

```java
@Order(Ordered.HIGHEST_PRECEDENCE)  // Runs first, before GlobalExceptionHandler
@RestControllerAdvice
public class BusinessExceptionHandler {

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRequest(InvalidRequestException ex) {
        String message = ex.hasFieldErrors()
            ? "Validation failed: " + ex.getFieldErrors().size() + " field error(s)"
            : (ex.getMessage() != null ? ex.getMessage() : "Invalid request");
        
        return ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST)
                .message(message)
                .build();
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex) {
        String message = ex.hasDetailedContext()
            ? ex.getClientMessage()
            : (ex.getMessage() != null ? ex.getMessage() : "Duplicate resource");
        
        return ErrorResponse.builder()
                .status(HttpStatus.CONFLICT)
                .message(message)
                .build();
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleBusinessStateConflict(IllegalStateException ex) {
        String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
            ? ex.getMessage()
            : "Business rule conflict";
        
        return ErrorResponse.builder()
                .status(HttpStatus.CONFLICT)
                .message(message)
                .build();
    }
}
```

---

## Best Practices

### DO:
- ✅ Use factory methods for common scenarios
- ✅ Provide descriptive error messages
- ✅ Include context (field names, resource types, values)
- ✅ Use appropriate severity levels (InvalidRequestException)
- ✅ Throw early when validation fails
- ✅ Keep messages user-friendly and actionable

### DON'T:
- ❌ Use domain exceptions for framework-level errors (let GlobalExceptionHandler catch them)
- ❌ Catch exceptions silently (always re-throw or handle explicitly)
- ❌ Include sensitive data in error messages (passwords, credit cards, etc.)
- ❌ Throw with full stack trace in message (too verbose)
- ❌ Use checked exceptions (extend RuntimeException for domain exceptions)

---

## Testing Domain Exceptions

### Unit Test Example

```java
@ExtendWith(MockitoExtension.class)
class SupplierServiceTest {
    
    @InjectMocks
    private SupplierService supplierService;
    
    @Mock
    private SupplierRepository supplierRepository;
    
    @Test
    void testCreateSupplier_DuplicateName() {
        // Arrange
        CreateSupplierRequest req = CreateSupplierRequest.builder()
                .name("ACME Inc")
                .email("acme@example.com")
                .build();
        
        when(supplierRepository.existsByNameIgnoreCase("ACME Inc"))
                .thenReturn(true);
        
        // Act & Assert
        assertThrows(DuplicateResourceException.class, () -> {
            supplierService.createSupplier(req);
        });
    }
    
    @Test
    void testDeleteSupplier_WithActiveInventory() {
        // Arrange
        Long supplierId = 1L;
        Supplier supplier = new Supplier();
        supplier.setId(supplierId);
        supplier.setName("ACME Inc");
        
        when(supplierRepository.findById(supplierId))
                .thenReturn(Optional.of(supplier));
        when(inventoryRepository.existsBySupplier(supplier))
                .thenReturn(true);
        
        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            supplierService.deleteSupplier(supplierId);
        });
        
        assertThat(exception.getMessage())
                .contains("Cannot delete supplier");
    }
}
```

---

## Related Documentation

- **[Exception Architecture Overview](./index.md)** – Exception types and hierarchy
- **[Global Exception Handler](./global-exception-handler.md)** – Framework exception handling
- **[BusinessExceptionHandler](./global-exception-handler.md)** – Domain exception handler
- **[Error Response Structure](./error-response-structure.md)** – JSON response format
- **[Exception-to-HTTP Mapping](./exception-to-http-mapping.md)** – Status code mapping
- **[Guidelines & Best Practices](./guidelines-and-best-practices.md)** – Exception handling best practices

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-20 | Initial comprehensive documentation |

---

## Quick Reference

### Creating InvalidRequestException

```java
// Required field missing
throw InvalidRequestException.requiredField("email");

// Invalid format
throw InvalidRequestException.invalidFormat("sku", "XXX-YYYY");

// Value out of range
throw InvalidRequestException.valueOutOfRange("quantity", 1, 999);

// Business rule violation
throw InvalidRequestException.businessRuleViolation("Cannot order zero quantity");

// Security violation
throw InvalidRequestException.securityViolation("Email is blacklisted");

// Custom message
throw new InvalidRequestException("Custom validation error");
```

### Creating DuplicateResourceException

```java
// Supplier duplicate
throw DuplicateResourceException.supplierName("ACME Inc");

// Inventory item SKU duplicate
throw DuplicateResourceException.inventoryItemSku("SKU-12345");

// Inventory item name duplicate
throw DuplicateResourceException.inventoryItemName("Widget A");

// Custom message
throw new DuplicateResourceException("Custom duplicate message");
```

### Creating IllegalStateException

```java
// Business state violation
throw new IllegalStateException("Cannot delete supplier with active inventory");
throw new IllegalStateException("Cannot cancel shipped order");
throw new IllegalStateException("Cannot modify locked financial record");
```
