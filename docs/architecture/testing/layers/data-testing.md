# Data Testing Strategy

## Overview

Comprehensive data testing approach ensuring data integrity, consistency, and reliability across all persistence layers of the inventory management system.

## Data Testing Architecture

### Repository Layer Testing
**Technology**: @DataJpaTest, TestContainers, Spring Data JPA
**Scope**: Data access patterns, query optimization, constraint validation

```java
@DataJpaTest
@Testcontainers
class InventoryItemRepositoryTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("test_inventory")
        .withUsername("test")
        .withPassword("test");
    
    @Test
    void shouldEnforceUniqueConstraint_OnSupplierAndName() {
        // ENTERPRISE: Data integrity constraint validation
        InventoryItem item1 = new InventoryItem("Widget", "supplier-1");
        repository.save(item1);
        
        InventoryItem item2 = new InventoryItem("Widget", "supplier-1");
        assertThatThrownBy(() -> repository.save(item2))
            .isInstanceOf(DataIntegrityViolationException.class);
    }
}
```

### Database Schema Testing
**Purpose**: Schema evolution, migration validation, constraint enforcement
**Tools**: Flyway, Liquibase, custom schema validation

```java
@SpringBootTest
@TestPropertySource(properties = {
    "spring.flyway.clean-on-validation-error=true",
    "spring.jpa.hibernate.ddl-auto=validate"
})
class DatabaseSchemaTest {
    
    @Test
    void shouldValidateSchemaIntegrity() {
        // ENTERPRISE: Validates schema matches entity definitions
        // Hibernate validates against actual database schema
    }
    
    @Test
    void shouldApplyMigrationsSuccessfully() {
        // ENTERPRISE: Migration script validation
        flyway.migrate();
        assertThat(flyway.info().current().getVersion()).isEqualTo("1.0");
    }
}
```

## Data Validation Testing

### Entity Validation
**Framework**: Bean Validation (JSR-303), Custom validators
**Coverage**: Field constraints, cross-field validation, business rules

```java
class InventoryItemValidationTest {
    
    private Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    
    @Test
    void shouldRejectNegativeQuantity() {
        InventoryItem item = new InventoryItem();
        item.setQuantity(-1);
        
        Set<ConstraintViolation<InventoryItem>> violations = validator.validate(item);
        assertThat(violations)
            .extracting(ConstraintViolation::getMessage)
            .contains("Quantity must be positive or zero");
    }
    
    @Test
    void shouldValidateBusinessRules() {
        // ENTERPRISE: Complex business rule validation
        InventoryItem item = new InventoryItem();
        item.setPrice(BigDecimal.ZERO);
        item.setQuantity(100);
        
        // Business rule: Items with quantity > 0 must have price > 0
        Set<ConstraintViolation<InventoryItem>> violations = validator.validate(item);
        assertThat(violations).isNotEmpty();
    }
}
```

### Data Transformation Testing
**Purpose**: DTO mapping, serialization, data format validation

```java
class InventoryItemMappingTest {
    
    @Test
    void shouldMapEntityToDTO_WithAllFields() {
        InventoryItem entity = new InventoryItem("Widget", "supplier-1");
        entity.setId("inv-1");
        entity.setPrice(new BigDecimal("19.99"));
        
        InventoryItemDTO dto = mapper.toDTO(entity);
        
        // ENTERPRISE: Comprehensive mapping validation
        assertThat(dto.getId()).isEqualTo("inv-1");
        assertThat(dto.getName()).isEqualTo("Widget");
        assertThat(dto.getPrice()).isEqualByComparingTo(new BigDecimal("19.99"));
    }
    
    @Test
    void shouldHandleNullValues_Gracefully() {
        InventoryItem entity = new InventoryItem();
        InventoryItemDTO dto = mapper.toDTO(entity);
        
        assertThat(dto).isNotNull();
        assertThat(dto.getId()).isNull();
        // ENTERPRISE: Null safety validation
    }
}
```

## Database Performance Testing

### Query Performance Validation
```java
@DataJpaTest
class InventoryQueryPerformanceTest {
    
    @Test
    void shouldExecuteComplexQuery_WithinSLA() {
        // Create test data
        createTestInventoryItems(1000);
        
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        
        Page<InventoryItem> results = repository.findBySupplierIdAndQuantityGreaterThan(
            "supplier-1", 10, PageRequest.of(0, 20));
        
        stopWatch.stop();
        
        // ENTERPRISE: Query performance SLA validation
        assertThat(stopWatch.getTotalTimeMillis()).isLessThan(100);
        assertThat(results.getContent()).isNotEmpty();
    }
}
```

### Index Effectiveness Testing
```java
@Test
@Sql("/test-data/large-inventory-dataset.sql")
void shouldUtilizeIndices_ForCommonQueries() {
    // ENTERPRISE: Index usage validation
    Query query = entityManager.createNativeQuery(
        "EXPLAIN ANALYZE SELECT * FROM inventory_items WHERE supplier_id = ?1");
    query.setParameter(1, "supplier-1");
    
    String executionPlan = (String) query.getSingleResult();
    assertThat(executionPlan).contains("Index Scan");
    assertThat(executionPlan).doesNotContain("Seq Scan");
}
```

## Transaction Testing

### Transaction Isolation Testing
```java
@SpringBootTest
@Transactional
class TransactionIsolationTest {
    
    @Test
    void shouldPreventDirtyReads() {
        // ENTERPRISE: Transaction isolation validation
        CompletableFuture<Void> transaction1 = CompletableFuture.runAsync(() -> {
            inventoryService.updateQuantity("inv-1", 100);
            // Transaction not yet committed
        });
        
        CompletableFuture<Integer> transaction2 = CompletableFuture.supplyAsync(() -> {
            return inventoryService.getQuantity("inv-1");
        });
        
        // Should read committed value, not uncommitted change
        assertThat(transaction2.join()).isNotEqualTo(100);
    }
}
```

### Rollback Testing
```java
@Test
@Rollback
void shouldRollbackOnException() {
    InventoryItem originalItem = repository.findById("inv-1").orElseThrow();
    int originalQuantity = originalItem.getQuantity();
    
    assertThatThrownBy(() -> {
        inventoryService.performComplexUpdate("inv-1", -1); // Invalid quantity
    }).isInstanceOf(ValidationException.class);
    
    // ENTERPRISE: Transaction rollback validation
    InventoryItem unchangedItem = repository.findById("inv-1").orElseThrow();
    assertThat(unchangedItem.getQuantity()).isEqualTo(originalQuantity);
}
```

## Data Migration Testing

### Migration Script Validation
```java
@FlywayTest
class DatabaseMigrationTest {
    
    @Test
    void shouldMigrateFromVersion1_0ToCurrentVersion() {
        // Start with baseline schema
        flyway.baseline();
        
        // Apply all migrations
        MigrateResult result = flyway.migrate();
        
        // ENTERPRISE: Migration success validation
        assertThat(result.success).isTrue();
        assertThat(result.migrationsExecuted).isGreaterThan(0);
        
        // Validate final schema state
        validateSchemaConsistency();
    }
    
    @Test
    void shouldPreserveData_DuringMigration() {
        // Insert test data in old schema
        insertTestDataOldSchema();
        
        // Apply migration
        flyway.migrate();
        
        // ENTERPRISE: Data preservation validation
        assertThat(countInventoryItems()).isEqualTo(EXPECTED_ITEM_COUNT);
        validateDataIntegrityPostMigration();
    }
}
```

### Backward Compatibility Testing
```java
@Test
void shouldMaintainBackwardCompatibility_ForAPIResponses() {
    // ENTERPRISE: API contract data compatibility
    InventoryItemDTO dto = inventoryService.getItem("inv-1");
    
    // Validate required fields are present
    assertThat(dto.getId()).isNotNull();
    assertThat(dto.getName()).isNotNull();
    
    // Validate new optional fields don't break existing clients
    JsonNode jsonResponse = objectMapper.valueToTree(dto);
    assertThat(jsonResponse.has("newField")).isTrue();
    assertThat(jsonResponse.get("newField").isNull() || 
               jsonResponse.get("newField").isTextual()).isTrue();
}
```

## Test Data Management

### Test Data Factories
```java
@Component
public class InventoryTestDataFactory {
    
    public InventoryItem createBasicItem() {
        return InventoryItem.builder()
            .name("Test Widget")
            .quantity(10)
            .price(new BigDecimal("19.99"))
            .supplierId("test-supplier")
            .build();
    }
    
    public InventoryItem createLowStockItem() {
        // ENTERPRISE: Specific business scenario data
        return createBasicItem().toBuilder()
            .quantity(2)
            .build();
    }
    
    public List<InventoryItem> createBulkTestData(int count) {
        return IntStream.range(0, count)
            .mapToObj(i -> createBasicItem().toBuilder()
                .name("Widget " + i)
                .build())
            .collect(Collectors.toList());
    }
}
```

### Test Data Cleanup
```java
@TestMethodOrder(OrderAnnotation.class)
class InventoryIntegrationTest {
    
    @AfterEach
    void cleanupTestData() {
        // ENTERPRISE: Test isolation through data cleanup
        repository.deleteAll();
        jdbcTemplate.execute("ALTER SEQUENCE inventory_items_seq RESTART WITH 1");
    }
    
    @Test
    @Sql(scripts = "/test-data/complex-inventory-scenario.sql", 
         executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
    @Sql(scripts = "/test-data/cleanup.sql", 
         executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
    void shouldHandleComplexInventoryScenario() {
        // Test implementation with automated setup/cleanup
    }
}
```

---

*Last Updated: 2025-10-08*