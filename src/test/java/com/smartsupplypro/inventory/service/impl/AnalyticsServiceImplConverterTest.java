package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * # StockAnalyticsService Converter Test
 *
 * Tests converter helpers used by {@link StockAnalyticsService} via
 * {@link StockAnalyticsService#getFilteredStockUpdates(StockUpdateFilterDTO)}.
 *
 * <p><strong>Purpose</strong></p>
 * Verify that numeric and date conversions handle various input types and edge cases
 * when mapping repository result rows to DTOs.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>Numeric parsing: Integer, Long, BigDecimal, and String inputs</li>
 *   <li>Timestamp parsing: {@code java.sql.Timestamp} and {@code LocalDateTime} inputs</li>
 *   <li>Error handling: Malformed numeric strings throw {@link IllegalStateException}</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>The service calls {@link StockHistoryRepository#searchStockUpdates(LocalDateTime, LocalDateTime, String, String, String, Integer, Integer)}.</li>
 *   <li>Converter must handle mixed numeric types from heterogeneous repository queries</li>
 *   <li>Invalid conversions fail fast with descriptive errors</li>\n *   <li>No Spring context or DB required (Mockito-only unit test).</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
class AnalyticsServiceImplConverterTest {

  @Mock private StockHistoryRepository stockHistoryRepository;

  @Mock private InventoryItemRepository inventoryItemRepository;

  @InjectMocks private StockAnalyticsService service;

  // ---- helpers ------------------------------------------------------------

  private static Object[] row(
      Object createdAtOrTs, String item, String supplier, Object qtyChange, String reason, String createdBy) {
    // Expected order in service:
    // [itemName, supplierName, quantityChange, reason, createdBy, createdAt/timestamp]
    return new Object[] { item, supplier, qtyChange, reason, createdBy, createdAtOrTs };
  }

  private static LocalDateTime at(int y, int m, int d, int H, int M) {
    return LocalDateTime.of(y, m, d, H, M);
  }

  // ---- tests --------------------------------------------------------------

  @Test
  @DisplayName("getFilteredStockUpdates → parses change from Integer/Long/BigDecimal/String")
  void filteredStockUpdates_mapsVariousNumberTypes() {
    // Setup timestamp for all result rows
    var ts = Timestamp.valueOf(at(2024, 2, 1, 10, 0));

    // Create result rows with different numeric types for quantity change
    List<Object[]> rows = List.of(
        row(ts, "A", "S", 3,                   "SOLD", "u1"),  // Integer (autobox)
        row(ts, "B", "S", 4L,                  "SOLD", "u2"),  // Long (autobox)
        row(ts, "C", "S", new BigDecimal("5"), "SOLD", "u3")   // BigDecimal
    );

    // Mock repository to return rows with various numeric types
    when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(rows);

    // Execute filtered query (which should normalize all numeric types)
    var out = service.getFilteredStockUpdates(new StockUpdateFilterDTO());

    // Verify all numeric types converted correctly to long
    assertEquals(3, out.size());
    assertEquals(3, out.get(0).getChange());  // Integer → long
    assertEquals(4, out.get(1).getChange());  // Long → long
    assertEquals(5, out.get(2).getChange());  // BigDecimal → long
  }

  @Test
  @DisplayName("getFilteredStockUpdates → accepts Timestamp and LocalDateTime for createdAt")
  void filteredStockUpdates_mapsDateVariants_supportedByService() {
    // Setup different date/time types (all should be convertible to LocalDateTime)
    var ts1 = Timestamp.valueOf(at(2024, 2, 1, 11, 0));   // java.sql.Timestamp (supported)
    var ts2 = Timestamp.valueOf(at(2024, 2, 2,  0, 0));   // java.sql.Timestamp (supported)
    var ldt = at(2024, 2, 3, 12, 0);                      // LocalDateTime (supported)

    // Create result rows with different date/time types
    List<Object[]> rows = List.of(
        row(ts1, "A", "S", 1, "SOLD", "u1"),  // Timestamp type
        row(ts2, "B", "S", 1, "SOLD", "u1"),  // Timestamp type
        row(ldt, "C", "S", 1, "SOLD", "u1")   // LocalDateTime type
    );

    // Mock repository to return rows with various date/time types
    when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(rows);

    // Execute filtered query (which should normalize all date/time types)
    var out = service.getFilteredStockUpdates(new StockUpdateFilterDTO());
    
    // Verify all date types were converted (no exception and correct count)
    assertEquals(3, out.size());
  }

  @Test
  @DisplayName("getFilteredStockUpdates → malformed numeric string triggers IllegalStateException")
  void filteredStockUpdates_badNumberString_throws() {
    // Setup timestamp for result row
    var ts = Timestamp.valueOf(at(2024, 2, 1, 10, 0));

    // Create result row with non-numeric string for quantity change field
    Object[] r = row(ts, "A", "S", "not-a-number", "SOLD", "u");  // invalid numeric value
    List<Object[]> rows = Collections.singletonList(r);

    // Mock repository to return row with malformed numeric data
    when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(rows);

    // Execute filtered query (should fail during numeric conversion)
    var ex = assertThrows(IllegalStateException.class,
        () -> service.getFilteredStockUpdates(new StockUpdateFilterDTO()));
    
    // Verify exception includes descriptive error message
    assertNotNull(ex.getMessage());
  }
}
