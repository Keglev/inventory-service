package com.smartsupplypro.inventory.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Unit tests for {@link StockAnalyticsService} focusing on date-window defaulting and validation
 * via public methods (no direct access to private helpers).
 *
 * <p><strong>Purpose</strong></p>
 * <ul>
 *   <li>Verify that when callers pass <code>null</code> start/end dates, the service computes a sensible default window and passes normalized values to the repository.</li>
 *   <li>Exercise the validation branch where start &gt; end to ensure {@link InvalidRequestException} is thrown.</li>
 *   <li>Exercise non-blank validation for required parameters on public APIs (e.g. getPriceTrend).</li>
 * </ul>
 * 
 * Unit tests focused on date-window defaulting and validation for
 * {@link StockAnalyticsService#getMonthlyStockMovement(LocalDate, LocalDate, String)}
 * and parameter validation for {@link StockAnalyticsService#getPriceTrend(String, String, LocalDate, LocalDate)}.
 *
 * <p><strong>Scope</strong></p>
 * <ul>
 *   <li>Mockito-only unit tests: no Spring context, no DB, no controller layer.</li>
 *   <li>We capture arguments sent to repositories to assert defaulting/normalization.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplWindowTest {

  @Mock private StockHistoryRepository stockHistoryRepository;

  @Mock private InventoryItemRepository inventoryItemRepository;

  @InjectMocks private StockAnalyticsService service;

  @Test
  @DisplayName("getMonthlyStockMovement(null,null,null) → defaults dates and passes normalized args")
  void monthlyStockMovement_defaultsWhenDatesNull() {
    Object[] r = new Object[] { "2024-02", 0L, 0L }; // three columns: YYYY-MM, stockIn, stockOut
    java.util.List<Object[]> rows = java.util.Collections.singletonList(r);

    when(stockHistoryRepository.getMonthlyStockMovementBySupplier(any(), any(), isNull()))
        .thenReturn(rows);

    service.getMonthlyStockMovement(null, null, null);

    var startCap = ArgumentCaptor.forClass(LocalDateTime.class);
    var endCap   = ArgumentCaptor.forClass(LocalDateTime.class);
    var supplierCap = ArgumentCaptor.forClass(String.class);

    verify(stockHistoryRepository).getMonthlyStockMovementBySupplier(
        startCap.capture(), endCap.capture(), supplierCap.capture()
    );

    // We don't enforce a specific default window here; we assert it is coherent and ordered.
    LocalDateTime start = startCap.getValue();
    LocalDateTime end   = endCap.getValue();

    assertNotNull(start, "defaulted start must not be null");
    assertNotNull(end,   "defaulted end must not be null");
    assertFalse(end.isBefore(start), "end must be >= start");
    assertNull(supplierCap.getValue(), "supplier should remain null when unspecified");
  }

  @Test
  @DisplayName("getMonthlyStockMovement → start after end throws InvalidRequestException")
  void monthlyStockMovement_startAfterEnd_throws() {
    var ex = assertThrows(InvalidRequestException.class,
        () -> service.getMonthlyStockMovement(
            LocalDate.parse("2024-03-10"),
            LocalDate.parse("2024-03-01"),
            null
        ));
    // If your service has a stable message, assert it:
    // assertTrue(ex.getMessage().contains("start must be on/before end"));
    assertNotNull(ex.getMessage());
  }

  @Test
  @DisplayName("getPriceTrend → blank itemId triggers InvalidRequestException")
  void getPriceTrend_blankItemId_throws() {
    var ex = assertThrows(InvalidRequestException.class,
        () -> service.getPriceTrend(
            "   ",               // blank
            null,                // supplier
            LocalDate.now().minusDays(1),
            LocalDate.now()
        ));
    // If message is stable, assert concrete text:
    // assertTrue(ex.getMessage().contains("itemId must not be blank"));
    assertNotNull(ex.getMessage());
  }
}

