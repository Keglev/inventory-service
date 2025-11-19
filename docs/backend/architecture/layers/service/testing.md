[⬅️ Back to Layers Overview](./index.md)

# Testing Service Layer

## Unit Testing with Mockito

Services are tested via unit tests with mocked repositories. Mockito enables isolation of service logic from external dependencies:

```java
@ExtendWith(MockitoExtension.class)
class SupplierServiceImplTest {
    
    @Mock
    private SupplierRepository repository;
    
    @Mock
    private SupplierValidator validator;
    
    @Mock
    private SupplierMapper mapper;
    
    @InjectMocks
    private SupplierServiceImpl service;
    
    @Test
    void testCreateSuccess() {
        // Arrange
        CreateSupplierDTO dto = new CreateSupplierDTO("TechCorp");
        Supplier entity = new Supplier("TechCorp");
        Supplier saved = new Supplier("uuid-123", "TechCorp");
        SupplierDTO expected = new SupplierDTO("uuid-123", "TechCorp");
        
        when(mapper.toEntity(dto)).thenReturn(entity);
        when(repository.save(entity)).thenReturn(saved);
        when(mapper.toDTO(saved)).thenReturn(expected);
        
        // Act
        SupplierDTO result = service.create(dto);
        
        // Assert
        assertNotNull(result);
        assertEquals("uuid-123", result.getId());
        assertEquals("TechCorp", result.getName());
        verify(validator).validateRequiredFields(dto);
        verify(validator).validateUniquenessOnCreate("TechCorp");
        verify(repository).save(entity);
    }
    
    @Test
    void testCreateDuplicateName() {
        // Arrange
        CreateSupplierDTO dto = new CreateSupplierDTO("TechCorp");
        
        doThrow(new IllegalStateException("Duplicate name"))
            .when(validator).validateUniquenessOnCreate("TechCorp");
        
        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            service.create(dto);
        });
        
        // Verify repository was NOT called
        verify(repository, never()).save(any());
    }
    
    @Test
    void testFindByIdNotFound() {
        // Arrange
        when(repository.findById("unknown-id"))
            .thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(NoSuchElementException.class, () -> {
            service.findById("unknown-id");
        });
    }
    
    @Test
    void testDeleteSuccess() {
        // Arrange
        Supplier supplier = new Supplier("uuid-123", "TechCorp");
        
        when(repository.findById("uuid-123"))
            .thenReturn(Optional.of(supplier));
        doNothing().when(validator).validateDeletionAllowed("uuid-123");
        
        // Act
        service.delete("uuid-123");
        
        // Assert
        verify(repository).delete(supplier);
    }
    
    @Test
    void testDeleteWithConstraint() {
        // Arrange
        Supplier supplier = new Supplier("uuid-123", "TechCorp");
        
        when(repository.findById("uuid-123"))
            .thenReturn(Optional.of(supplier));
        doThrow(new IllegalStateException("Items exist"))
            .when(validator).validateDeletionAllowed("uuid-123");
        
        // Act & Assert
        assertThrows(IllegalStateException.class, () -> {
            service.delete("uuid-123");
        });
        
        // Verify deletion was NOT called
        verify(repository, never()).delete(any());
    }
}
```

## Testing Business Logic

Test the business logic, not the mocks:

```java
@ExtendWith(MockitoExtension.class)
class InventoryItemServiceImplTest {
    
    @Mock
    private InventoryItemRepository itemRepository;
    
    @Mock
    private SupplierRepository supplierRepository;
    
    @Mock
    private StockHistoryService stockHistoryService;
    
    @InjectMocks
    private InventoryItemServiceImpl service;
    
    @Test
    void testUpdateStockIncrease() {
        // Arrange - setup entities
        InventoryItem item = new InventoryItem();
        item.setId("item-1");
        item.setQuantity(100);
        
        when(itemRepository.findById("item-1"))
            .thenReturn(Optional.of(item));
        
        // Act - increase quantity
        service.updateStock("item-1", 150, 
            StockChangeReason.PURCHASE, "Restocking");
        
        // Assert - verify business logic
        assertEquals(150, item.getQuantity());
        verify(stockHistoryService).logStockChange(
            eq(item), eq(100), eq(150), 
            eq(StockChangeReason.PURCHASE), eq("Restocking"));
    }
    
    @Test
    void testUpdateStockDecreaseNegative() {
        // Arrange
        InventoryItem item = new InventoryItem();
        item.setId("item-1");
        item.setQuantity(50);
        
        when(itemRepository.findById("item-1"))
            .thenReturn(Optional.of(item));
        
        // Act & Assert - negative quantity not allowed
        assertThrows(IllegalArgumentException.class, () -> {
            service.updateStock("item-1", -10, 
                StockChangeReason.SALE, "Invalid");
        });
    }
}
```

## Testing with ArgumentCaptor

Verify exact arguments passed to dependencies:

```java
@Test
void testCreateSetsAuditFields() {
    // Arrange
    CreateSupplierDTO dto = new CreateSupplierDTO("TechCorp");
    ArgumentCaptor<Supplier> captor = ArgumentCaptor.forClass(Supplier.class);
    
    when(mapper.toEntity(dto)).thenReturn(new Supplier());
    when(repository.save(any())).thenAnswer(invocation -> {
        Supplier arg = invocation.getArgument(0);
        arg.setId("uuid-123");
        return arg;
    });
    
    // Act
    service.create(dto);
    
    // Assert - verify exact audit fields
    verify(repository).save(captor.capture());
    Supplier saved = captor.getValue();
    
    assertNotNull(saved.getCreatedBy());
    assertNotNull(saved.getCreatedAt());
}
```

## Testing Exception Scenarios

Test all exception paths:

```java
@Test
void testCreateWithValidationFailure() {
    // Test each validation failure independently
    CreateSupplierDTO dto = new CreateSupplierDTO("");
    
    doThrow(new IllegalArgumentException("Name required"))
        .when(validator).validateRequiredFields(dto);
    
    assertThrows(IllegalArgumentException.class, () -> {
        service.create(dto);
    });
    
    verify(repository, never()).save(any());
}

@Test
void testFindByIdDifferentErrors() {
    // Test 404 Not Found
    when(repository.findById("unknown")).thenReturn(Optional.empty());
    assertThrows(NoSuchElementException.class, () -> {
        service.findById("unknown");
    });
    
    // Test success path
    Supplier supplier = new Supplier("uuid", "TechCorp");
    SupplierDTO expected = new SupplierDTO("uuid", "TechCorp");
    
    when(repository.findById("uuid")).thenReturn(Optional.of(supplier));
    when(mapper.toDTO(supplier)).thenReturn(expected);
    
    SupplierDTO result = service.findById("uuid");
    assertNotNull(result);
    assertEquals("TechCorp", result.getName());
}
```

## Testing Guidelines

### 1. Test One Thing Per Test
```java
// ✅ Good - One assertion focus
@Test
void testCreateValidatesUniqueness() {
    // Only test uniqueness validation
}

// ❌ Bad - Multiple assertions
@Test
void testCreate() {
    // Tests validation, mapping, persistence, audit - too many things
}
```

### 2. Use Descriptive Names
```java
// ✅ Good - Clear test intent
void testCreateThrowsExceptionWhenSupplierNameAlreadyExists() { }
void testDeleteThrowsExceptionWhenItemsExist() { }
void testUpdatePreservesCreatedByField() { }

// ❌ Bad - Vague names
void testCreate() { }
void testDelete() { }
void testUpdate() { }
```

### 3. AAA Pattern (Arrange, Act, Assert)
```java
@Test
void testExample() {
    // Arrange - setup
    CreateSupplierDTO dto = new CreateSupplierDTO("TechCorp");
    
    // Act - execute
    SupplierDTO result = service.create(dto);
    
    // Assert - verify
    assertNotNull(result);
}
```

### 4. Verify Interactions, Not Implementations
```java
// ✅ Good - Verify what matters
verify(validator).validateUniquenessOnCreate(dto.getName());
verify(repository).save(any());

// ❌ Bad - Over-specifying implementation
verify(repository).findById("uuid");
verify(repository).save(entity);
verify(mapper).toEntity(dto);
verify(mapper).toDTO(saved);
// Too much detail, brittle test
```

---

[⬅️ Back to Layers Overview](./index.md)
