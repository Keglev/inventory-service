# JUnit 5 Implementation Guide

## Overview

Comprehensive guide to JUnit 5 implementation patterns and best practices used throughout the Smart Supply Pro testing strategy.

## JUnit 5 Architecture

### Core Components
- **JUnit Platform**: Foundation for launching testing frameworks on the JVM
- **JUnit Jupiter**: Programming and extension model for writing tests
- **JUnit Vintage**: Test engine for running JUnit 3 and 4 based tests

### Test Lifecycle

```java
class InventoryItemLifecycleTest {
    
    @BeforeAll
    static void setupTestSuite() {
        // ENTERPRISE: One-time setup for entire test class
        System.setProperty("test.environment", "junit");
    }
    
    @BeforeEach
    void setupEachTest() {
        // ENTERPRISE: Setup before each test method
        testDataFactory.reset();
    }
    
    @Test
    void shouldExecuteTestMethod() {
        // Actual test implementation
    }
    
    @AfterEach
    void cleanupEachTest() {
        // ENTERPRISE: Cleanup after each test method
        testDataFactory.cleanup();
    }
    
    @AfterAll
    static void teardownTestSuite() {
        // ENTERPRISE: One-time cleanup for entire test class
        System.clearProperty("test.environment");
    }
}
```

## Advanced JUnit 5 Features

### Parameterized Tests
```java
class InventoryValidationTest {
    
    @ParameterizedTest
    @ValueSource(strings = {"", " ", "   "})
    @DisplayName("Should reject blank inventory names")
    void shouldRejectBlankNames(String invalidName) {
        // ENTERPRISE: Data-driven validation testing
        InventoryItem item = new InventoryItem(invalidName, "supplier-1");
        assertThatThrownBy(() -> validator.validate(item))
            .isInstanceOf(ValidationException.class);
    }
    
    @ParameterizedTest
    @CsvSource({
        "-1, false",
        "0, true", 
        "1, true",
        "100, true"
    })
    void shouldValidateQuantity(int quantity, boolean isValid) {
        InventoryItem item = new InventoryItem("Widget", "supplier-1");
        item.setQuantity(quantity);
        
        if (isValid) {
            assertThatNoException().isThrownBy(() -> validator.validate(item));
        } else {
            assertThatThrownBy(() -> validator.validate(item))
                .isInstanceOf(ValidationException.class);
        }
    }
    
    @ParameterizedTest
    @MethodSource("provideInvalidPriceScenarios")
    void shouldRejectInvalidPrices(BigDecimal price, String expectedMessage) {
        // ENTERPRISE: Complex parameterized business rule testing
        InventoryItem item = new InventoryItem("Widget", "supplier-1");
        item.setPrice(price);
        
        ValidationException exception = assertThrows(
            ValidationException.class, 
            () -> validator.validate(item)
        );
        assertThat(exception.getMessage()).contains(expectedMessage);
    }
    
    private static Stream<Arguments> provideInvalidPriceScenarios() {
        return Stream.of(
            Arguments.of(new BigDecimal("-1.00"), "Price must be positive"),
            Arguments.of(new BigDecimal("0.001"), "Price precision too high"),
            Arguments.of(new BigDecimal("99999.99"), "Price exceeds maximum")
        );
    }
}
```

### Dynamic Tests
```java
class InventoryRuleEngineTest {
    
    @TestFactory
    @DisplayName("Business Rule Validation")
    Stream<DynamicTest> businessRuleTests() {
        // ENTERPRISE: Runtime test generation for business rules
        return businessRuleRepository.findAll().stream()
            .map(rule -> DynamicTest.dynamicTest(
                "Rule: " + rule.getName(),
                () -> validateBusinessRule(rule)
            ));
    }
    
    private void validateBusinessRule(BusinessRule rule) {
        InventoryItem testItem = createTestItemForRule(rule);
        boolean result = ruleEngine.evaluate(rule, testItem);
        assertThat(result).isEqualTo(rule.getExpectedResult());
    }
}
```

### Conditional Test Execution
```java
class EnvironmentSpecificTest {
    
    @Test
    @EnabledOnOs(OS.LINUX)
    @DisplayName("Linux-specific file system test")
    void shouldHandleLinuxFilePaths() {
        // ENTERPRISE: OS-specific testing
    }
    
    @Test
    @EnabledIfSystemProperty(named = "test.environment", matches = "integration")
    void shouldRunInIntegrationEnvironment() {
        // ENTERPRISE: Environment-conditional testing
    }
    
    @Test
    @EnabledIfEnvironmentVariable(named = "DATABASE_URL", matches = ".*oracle.*")
    void shouldRunWithOracleDatabase() {
        // ENTERPRISE: Database-specific testing
    }
}
```

## Test Organization Patterns

### Nested Tests
```java
@DisplayName("Inventory Item Operations")
class InventoryItemOperationsTest {
    
    @Nested
    @DisplayName("Creation Operations")
    class CreationOperations {
        
        @Test
        @DisplayName("Should create item with valid data")
        void shouldCreateWithValidData() {
            // ENTERPRISE: Hierarchical test organization
        }
        
        @Test
        @DisplayName("Should reject creation with invalid data")
        void shouldRejectInvalidData() {
            // Focused on creation validation
        }
    }
    
    @Nested
    @DisplayName("Update Operations")
    class UpdateOperations {
        
        @BeforeEach
        void setupExistingItem() {
            // Setup specific to update operations
        }
        
        @Test
        void shouldUpdateQuantity() {
            // Update-specific testing
        }
    }
    
    @Nested
    @DisplayName("Security Operations")
    class SecurityOperations {
        
        @Test
        @WithMockUser(roles = "ADMIN")
        void shouldAllowAdminOperations() {
            // ENTERPRISE: Security-focused test grouping
        }
        
        @Test
        @WithMockUser(roles = "USER")
        void shouldRestrictUserOperations() {
            // Role-based testing
        }
    }
}
```

### Test Method Ordering
```java
@TestMethodOrder(OrderAnnotation.class)
class InventoryWorkflowTest {
    
    @Test
    @Order(1)
    @DisplayName("Step 1: Create inventory item")
    void shouldCreateInventoryItem() {
        // ENTERPRISE: Workflow-based testing sequence
        createdItemId = inventoryService.create(testItem).getId();
    }
    
    @Test
    @Order(2) 
    @DisplayName("Step 2: Update inventory quantity")
    void shouldUpdateQuantity() {
        inventoryService.updateQuantity(createdItemId, 50);
    }
    
    @Test
    @Order(3)
    @DisplayName("Step 3: Verify final state")
    void shouldVerifyFinalState() {
        InventoryItem finalItem = inventoryService.findById(createdItemId);
        assertThat(finalItem.getQuantity()).isEqualTo(50);
    }
}
```

## Custom Extensions

### Performance Testing Extension
```java
@ExtendWith(PerformanceTestExtension.class)
class InventoryPerformanceTest {
    
    @Test
    @PerformanceTest(maxDuration = 200, timeUnit = TimeUnit.MILLISECONDS)
    void shouldCreateInventoryItem_WithinSLA() {
        // ENTERPRISE: Automated performance validation
        inventoryService.create(testItem);
    }
}

public class PerformanceTestExtension implements BeforeEachCallback, AfterEachCallback {
    
    @Override
    public void beforeEach(ExtensionContext context) {
        getStore(context).put("startTime", System.currentTimeMillis());
    }
    
    @Override
    public void afterEach(ExtensionContext context) {
        long startTime = getStore(context).get("startTime", Long.class);
        long duration = System.currentTimeMillis() - startTime;
        
        PerformanceTest annotation = context.getRequiredTestMethod()
            .getAnnotation(PerformanceTest.class);
            
        if (annotation != null && duration > annotation.maxDuration()) {
            fail("Test exceeded maximum duration: " + duration + "ms");
        }
    }
}
```

### Security Context Extension
```java
@ExtendWith(SecurityContextExtension.class)
class InventorySecurityTest {
    
    @Test
    @WithSecurityContext(roles = {"ADMIN"}, tenantId = "tenant-1")
    void shouldAllowAdminAccess() {
        // ENTERPRISE: Custom security context setup
    }
}
```

## Test Configuration

### JUnit Configuration
```properties
# junit-platform.properties
junit.jupiter.execution.parallel.enabled=true
junit.jupiter.execution.parallel.mode.default=concurrent
junit.jupiter.execution.parallel.config.strategy=dynamic
junit.jupiter.execution.parallel.config.dynamic.factor=2

# Display names
junit.jupiter.displayname.generator.default=org.junit.jupiter.api.DisplayNameGenerator$ReplaceUnderscores

# Test discovery
junit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$OrderAnnotation
```

### Maven Configuration
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <version>3.0.0-M7</version>
    <configuration>
        <parallel>methods</parallel>
        <threadCount>4</threadCount>
        <includes>
            <include>**/*Test.java</include>
        </includes>
        <excludedGroups>integration</excludedGroups>
        <systemPropertyVariables>
            <junit.jupiter.execution.parallel.enabled>true</junit.jupiter.execution.parallel.enabled>
        </systemPropertyVariables>
    </configuration>
</plugin>
```

## Best Practices

### Test Naming Conventions
```java
class InventoryBestPracticesTest {
    
    // GOOD: Descriptive, action-oriented names
    @Test
    void shouldCreateInventoryItem_WhenValidDataProvided() { }
    
    @Test  
    void shouldThrowValidationException_WhenQuantityIsNegative() { }
    
    @Test
    void shouldReturnEmpty_WhenSearchingNonExistentSupplier() { }
    
    // ENTERPRISE: Use DisplayName for complex scenarios
    @Test
    @DisplayName("Should apply quantity discount when bulk order exceeds threshold")
    void shouldApplyBulkDiscount() { }
}
```

### Assertion Patterns
```java
class AssertionPatternsTest {
    
    @Test
    void shouldDemonstrateAssertionPatterns() {
        InventoryItem item = inventoryService.create(testData);
        
        // ENTERPRISE: Comprehensive object validation
        assertThat(item)
            .isNotNull()
            .extracting(InventoryItem::getId, InventoryItem::getName, InventoryItem::getQuantity)
            .containsExactly("expected-id", "Widget", 10);
            
        // Collection assertions
        List<InventoryItem> items = inventoryService.findBySupplier("supplier-1");
        assertThat(items)
            .hasSize(3)
            .extracting(InventoryItem::getName)
            .containsExactlyInAnyOrder("Widget A", "Widget B", "Widget C");
            
        // Exception assertions
        assertThatThrownBy(() -> inventoryService.create(invalidData))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("quantity")
            .hasRootCauseInstanceOf(ConstraintViolationException.class);
    }
}
```

---

*Last Updated: 2025-10-08*