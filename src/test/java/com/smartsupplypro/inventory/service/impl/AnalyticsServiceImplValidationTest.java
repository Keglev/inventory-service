package com.smartsupplypro.inventory.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Validation tests for {@link StockAnalyticsService}.
 * 
 * <p><strong>Purpose</strong></p>
 * Verify that analytics operations validate input parameters and reject invalid requests
 * with {@link InvalidRequestException} and explanatory error messages.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>Supplier ID validation (blank/null rejection) for supplier-scoped queries</li>
 *   <li>Item ID validation (blank/null rejection) for item-specific queries like getPriceTrend</li>
 *   <li>Date range validation (start ≤ end) to reject invalid ordering</li>
 *   <li>Filter object validation (null check, min ≤ max quantity ranges)</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Mockito-only unit tests: no Spring context, no DB, no repository data needed</li>
 *   <li>Test mocks return empty results; focus is on parameter validation before delegation</li>
 *   <li>All invalid inputs should throw InvalidRequestException with non-null message</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unused")
class AnalyticsServiceImplValidationTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private InventoryItemRepository inventoryItemRepository;
    @InjectMocks private StockAnalyticsService service;

    @Test
    void getItemUpdateFrequency_blankSupplier_throws() {
        // Execute with blank supplier ID (whitespace-only string)
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getItemUpdateFrequency(" "));
        // Verify exception includes validation message
        assertNotNull(ex.getMessage());
    }

    @Test
    void getItemsBelowMinimumStock_blankSupplier_throws() {
        // Execute with blank supplier ID (double-space string)
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getItemsBelowMinimumStock("  "));
        // Verify exception includes validation message
        assertNotNull(ex.getMessage());
    }

    @Test
    void getFilteredStockUpdates_rejectsInvalidRange() {
        // Create filter with invalid date range: start (Feb 10) > end (Feb 1)
        StockUpdateFilterDTO f = new StockUpdateFilterDTO();
        f.setStartDate(LocalDateTime.of(2024, 2, 10, 0, 0));  // start (later)
        f.setEndDate(LocalDateTime.of(2024, 2, 1, 0, 0));     // end (earlier) - invalid ordering

        // Execute with invalid range
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getFilteredStockUpdates(f));
        // Verify exception includes validation message
        assertNotNull(ex.getMessage());
    }

    @Test
    void getFilteredStockUpdates_rejectsMinGreaterThanMax() {
        // Create filter with valid date range but invalid quantity bounds
        StockUpdateFilterDTO f = new StockUpdateFilterDTO();
        f.setStartDate(LocalDateTime.of(2024, 2, 1, 0, 0));
        f.setEndDate(LocalDateTime.of(2024, 2, 2, 0, 0));
        f.setMinChange(10);   // minimum quantity
        f.setMaxChange(5);    // maximum quantity (less than minimum - invalid)

        // Execute with min > max bounds
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getFilteredStockUpdates(f));
        // Verify exception includes validation message
        assertNotNull(ex.getMessage());
    }

    @Test
    void getFilteredStockUpdates_nullFilter_throwsInvalidRequest() {
        // Execute with null filter object (should validate before attempting processing)
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class, () -> service.getFilteredStockUpdates(null));
        // Verify exception includes validation message
        assertNotNull(ex.getMessage());
    }

    @Test
    void getPriceTrend_invalidRange_throws() {
        // Execute with invalid date range: start (Feb 10) > end (Feb 1)
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class,
                () -> service.getPriceTrend("I1", "S1",
                        LocalDate.parse("2024-02-10"),  // start (later)
                        LocalDate.parse("2024-02-01"))); // end (earlier) - invalid ordering
        // Verify exception includes validation message
        assertNotNull(ex.getMessage());
    }

    @Test
    void getPriceTrend_blankItem_throws() {
        // Execute with blank item ID (whitespace-only string)
        InvalidRequestException ex =
            assertThrows(InvalidRequestException.class,
                () -> service.getPriceTrend("  ", null,  // blank item ID
                        LocalDate.parse("2024-02-01"),
                        LocalDate.parse("2024-02-02")));
        // Verify exception includes validation message
        assertNotNull(ex.getMessage());
    }
}
