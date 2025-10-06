# Refactoring Impact Analysis: AnalyticsServiceImpl WAC Extraction

**Date**: October 6, 2025  
**Target**: Extract WAC (Weighted Average Cost) calculation logic into separate component  
**Status**: ⚠️ PLANNING ONLY - DO NOT IMPLEMENT YET

---

## 📊 Current Test Coverage

### Test Files for AnalyticsServiceImpl (4 files, 804 total lines)

| Test File | Lines | Purpose |
|-----------|-------|---------|
| **AnalyticsServiceImplWacTest.java** | 203 | 🎯 **PRIMARY IMPACT** - Tests WAC calculation algorithm |
| **AnalyticsServiceImplTest.java** | 354 | General analytics methods (may have WAC tests) |
| **AnalyticsServiceImplConverterTest.java** | 128 | Type conversion helpers (asLocalDate, asNumber, etc.) |
| **AnalyticsServiceImplWindowTest.java** | 119 | Date window validation and defaults |

---

## 🔍 What AnalyticsServiceImplWacTest Tests

**From file header documentation:**

```java
/**
 * Unit tests for getFinancialSummaryWAC(LocalDate, LocalDate, String).
 *
 * Verification goals:
 * - WAC replay over an event stream (opening, purchases, returns, write-offs, COGS, ending)
 * - Correct bucketing by StockChangeReason
 * - Window validation (start ≤ end) throws InvalidRequestException
 * - Over-issuing is clamped to zero (current service behavior)
 */
```

**Key Test Scenarios:**
- ✅ WAC algorithm correctness
- ✅ Event replay logic
- ✅ Bucket aggregation (purchases, COGS, write-offs, returns)
- ✅ Opening/ending inventory calculation
- ✅ Input validation (date ranges)

---

## ⚠️ Test Updates Required After Refactoring

### Answer: **YES, Significant Test Updates Required**

### Impact Level: **HIGH** 🔴

---

## 📋 Required Test Changes

### 1. AnalyticsServiceImplWacTest.java ⚠️ **MAJOR CHANGES**

**Current State:**
```java
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplWacTest {
    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @Mock private StockHistoryCustomRepository stockHistoryCustomRepository;
    
    @InjectMocks private AnalyticsServiceImpl service;
    
    @Test
    void testWacCalculation() {
        // Tests the WAC algorithm directly in AnalyticsServiceImpl
        var result = service.getFinancialSummaryWAC(from, to, supplierId);
        // Assertions...
    }
}
```

**After Refactoring:**

#### Option A: Keep Testing Through Service (Integration-style)
```java
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplWacTest {
    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @Mock private StockHistoryCustomRepository stockHistoryCustomRepository;
    @Mock private WacCalculator wacCalculator; // NEW DEPENDENCY
    
    @InjectMocks private AnalyticsServiceImpl service;
    
    @Test
    void testWacCalculation() {
        // Mock the calculator's behavior
        when(wacCalculator.calculateFinancialSummary(...))
            .thenReturn(expectedSummary);
            
        var result = service.getFinancialSummaryWAC(from, to, supplierId);
        
        // Verify service calls calculator correctly
        verify(wacCalculator).calculateFinancialSummary(anyList(), any(), any(), any(), any());
    }
}
```

#### Option B: Split Into Separate Test Files (RECOMMENDED ✅)
```java
// 1. WacCalculatorTest.java (NEW - 200+ lines)
//    Pure unit tests for WAC algorithm
//    - No mocks needed (uses test data directly)
//    - Tests algorithm correctness
//    - Tests edge cases (negative quantities, missing prices, etc.)

class WacCalculatorTest {
    private WacCalculator calculator = new WacCalculator();
    
    @Test
    void testSimplePurchaseAndSale() {
        List<StockEventRowDTO> events = List.of(
            purchaseEvent(100, 10.00),
            saleEvent(-50)
        );
        
        var summary = calculator.calculateFinancialSummary(
            events, startTime, endTime, from, to
        );
        
        assertEquals(100, summary.getPurchasesQty());
        assertEquals(1000.00, summary.getPurchasesCost());
        assertEquals(50, summary.getCogsQty());
        assertEquals(500.00, summary.getCogsCost());
        assertEquals(50, summary.getEndingQty());
        assertEquals(500.00, summary.getEndingValue());
    }
    
    @Test
    void testMovingAverageWithMultiplePurchases() { /* ... */ }
    
    @Test
    void testWriteOffsAtWac() { /* ... */ }
    
    @Test
    void testReturnToSupplierReducesPurchases() { /* ... */ }
}

// 2. AnalyticsServiceImplWacTest.java (SIMPLIFIED - 50 lines)
//    Tests service orchestration only
//    - Mocks WacCalculator
//    - Tests input validation
//    - Verifies repository calls
//    - Verifies calculator is called with correct parameters

class AnalyticsServiceImplWacTest {
    @Mock private WacCalculator wacCalculator;
    // ... other mocks
    
    @Test
    void testServiceCallsCalculatorWithCorrectEvents() {
        // Arrange
        List<StockEventRowDTO> mockEvents = createMockEvents();
        when(stockHistoryCustomRepository.findEventsUpTo(any(), any()))
            .thenReturn(mockEvents);
            
        // Act
        service.getFinancialSummaryWAC(from, to, supplierId);
        
        // Assert - verify calculator was called correctly
        verify(wacCalculator).calculateFinancialSummary(
            eq(mockEvents),
            any(LocalDateTime.class),
            any(LocalDateTime.class),
            eq(from),
            eq(to)
        );
    }
    
    @Test
    void testInputValidation() {
        // Test null checks, date range validation, etc.
    }
}
```

---

### 2. AnalyticsServiceImplConverterTest.java ⚠️ **MODERATE CHANGES**

**Current State**: Tests helper methods in `AnalyticsServiceImpl`:
- `asLocalDate(Object)`
- `asNumber(Object)`
- `asLocalDateTime(Object)`

**After Refactoring**: These helpers would likely move to a utility class

**Options:**
1. **Move tests** to new `TypeConversionUtilsTest.java`
2. **Keep tests** if helpers remain in service for other methods
3. **Duplicate tests** in both locations temporarily

---

### 3. AnalyticsServiceImplTest.java ⚠️ **MINOR CHANGES**

**Impact**: Depends on what else this file tests

**Likely Changes:**
- Add `@Mock WacCalculator` if it has WAC-related tests
- Update any tests that verify the complete behavior of `getFinancialSummaryWAC`

---

### 4. AnalyticsServiceImplWindowTest.java ✅ **NO CHANGES**

**Impact**: None - tests date window validation which stays in service

---

## 📊 Test Update Summary

| Test File | Lines | Current | After Refactoring | Change Type |
|-----------|-------|---------|-------------------|-------------|
| **AnalyticsServiceImplWacTest** | 203 | WAC algorithm tests | Service orchestration tests | 🔴 **MAJOR** - Split & Simplify |
| **WacCalculatorTest** | 0 | N/A | **NEW FILE** (~250 lines) | ✅ **NEW** - Pure algorithm tests |
| **AnalyticsServiceImplConverterTest** | 128 | Type helpers in service | May move to utils | 🟡 **MODERATE** - Possible relocation |
| **AnalyticsServiceImplWindowTest** | 119 | Date validation | Same | ✅ **NONE** |
| **AnalyticsServiceImplTest** | 354 | General analytics | Add WacCalculator mock | 🟡 **MINOR** - Mock updates |

---

## ✅ Benefits of Test Refactoring

### 1. **Better Test Isolation**
- **Before**: WAC tests mixed with service infrastructure mocking
- **After**: Pure algorithm tests without Spring/mocking overhead

### 2. **Faster Test Execution**
- **Before**: Tests require mocking repositories and service setup
- **After**: Pure unit tests run in milliseconds

### 3. **Easier to Add Test Cases**
- **Before**: Each test needs full mock setup
- **After**: Just create test events and verify results

### 4. **Clearer Test Intent**
- **Before**: "Is this testing the algorithm or the service?"
- **After**: Clear separation - algorithm tests vs orchestration tests

### 5. **Better Coverage**
- Can add more edge case tests to `WacCalculatorTest` without service complexity
- Can test algorithm in isolation with various event combinations

---

## 📝 Refactoring Checklist (When We Do It)

### Phase 1: Create New Component
- [ ] Create `WacCalculator.java` class
- [ ] Move WAC algorithm methods (applyInbound, issueAt, State, Issue)
- [ ] Move helper records (State, Issue)
- [ ] Add comprehensive JavaDoc to new class

### Phase 2: Create New Tests
- [ ] Create `WacCalculatorTest.java`
- [ ] Port algorithm-specific tests from `AnalyticsServiceImplWacTest`
- [ ] Add new edge case tests
- [ ] Verify 100% coverage of WAC algorithm

### Phase 3: Update Service
- [ ] Inject `WacCalculator` into `AnalyticsServiceImpl`
- [ ] Refactor `getFinancialSummaryWAC()` to delegate to calculator
- [ ] Keep input validation in service
- [ ] Keep repository calls in service

### Phase 4: Update Service Tests
- [ ] Update `AnalyticsServiceImplWacTest` to mock `WacCalculator`
- [ ] Simplify tests to verify orchestration only
- [ ] Remove detailed algorithm tests (now in `WacCalculatorTest`)
- [ ] Keep input validation tests

### Phase 5: Handle Helper Methods
- [ ] Decide if type conversion helpers move to utility class
- [ ] Update `AnalyticsServiceImplConverterTest` accordingly
- [ ] Update any other tests using these helpers

### Phase 6: Verification
- [ ] Run all tests: `mvn test`
- [ ] Verify coverage hasn't decreased
- [ ] Verify WAC calculation behavior is identical (regression testing)
- [ ] Update documentation

---

## 🎯 Bottom Line

**Q: Do we need to update tests if we refactor?**  
**A: YES - Significant test updates required**

**Estimated Effort:**
- **New Tests**: ~250 lines (`WacCalculatorTest.java`)
- **Updated Tests**: ~150 lines (existing test file modifications)
- **Total Test Work**: ~400 lines of test code changes

**Test Coverage Impact:**
- **Before Refactoring**: ~200 lines of WAC tests mixed with mocking
- **After Refactoring**: ~250 lines of pure algorithm tests + ~50 lines of orchestration tests
- **Net Result**: BETTER test coverage with clearer separation

**Recommendation:**
When we refactor (future session), budget **equal time** for:
- Code refactoring (2-3 hours)
- Test refactoring (2-3 hours)
- Verification & documentation (1 hour)

**Total refactoring session: 5-7 hours**

---

## 🚀 For Now: Proceed with Documentation

**Current Session Goal**: Add comprehensive documentation to existing code structure

**Future Session Goal**: Refactor with full test suite updates

---

**Last Updated**: October 6, 2025  
**Status**: Planning document - refactoring NOT yet approved
