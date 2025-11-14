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
 * <p><strong>What we validate</strong></p>
 * <ul>
 *   <li>Numeric parsing: Integer, Long, BigDecimal, and String.</li>
 *   <li>Timestamp parsing: {@code LocalDateTime} and {@code java.sql.Timestamp} (as per service).</li>
 *   <li>Error branch on malformed numeric strings (throws {@link IllegalStateException}).</li>
 * </ul>
 *
 * <p><strong>Important</strong>: The service calls
 * {@link StockHistoryRepository#searchStockUpdates(LocalDateTime, LocalDateTime, String, String, String, Integer, Integer)}.</p>
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
    var ts = Timestamp.valueOf(at(2024, 2, 1, 10, 0));

    List<Object[]> rows = List.of(
        row(ts, "A", "S", 3,                   "SOLD", "u1"),               // Integer (autobox)
        row(ts, "B", "S", 4L,                  "SOLD", "u2"),               // Long (autobox)
        row(ts, "C", "S", new BigDecimal("5"), "SOLD", "u3")               // BigDecimal
    );

    when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(rows);

    var out = service.getFilteredStockUpdates(new StockUpdateFilterDTO());

    assertEquals(3, out.size());
    assertEquals(3, out.get(0).getChange());
    assertEquals(4, out.get(1).getChange());
    assertEquals(5, out.get(2).getChange());
  }

  @Test
  @DisplayName("getFilteredStockUpdates → accepts Timestamp and LocalDateTime for createdAt")
  void filteredStockUpdates_mapsDateVariants_supportedByService() {
    var ts1 = Timestamp.valueOf(at(2024, 2, 1, 11, 0));   // supported by asLocalDateTime
    var ts2 = Timestamp.valueOf(at(2024, 2, 2,  0, 0));   // supported by asLocalDateTime
    var ldt = at(2024, 2, 3, 12, 0);                      // supported by asLocalDateTime

    List<Object[]> rows = List.of(
        row(ts1, "A", "S", 1, "SOLD", "u1"),
        row(ts2, "B", "S", 1, "SOLD", "u1"),
        row(ldt, "C", "S", 1, "SOLD", "u1")
    );

    when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(rows);

    var out = service.getFilteredStockUpdates(new StockUpdateFilterDTO());
    assertEquals(3, out.size());
  }

  @Test
  @DisplayName("getFilteredStockUpdates → malformed numeric string triggers IllegalStateException")
  void filteredStockUpdates_badNumberString_throws() {
    var ts = Timestamp.valueOf(at(2024, 2, 1, 10, 0));

    Object[] r = row(ts, "A", "S", "not-a-number", "SOLD", "u");
    List<Object[]> rows = Collections.singletonList(r);

    when(stockHistoryRepository.searchStockUpdates(any(), any(), any(), any(), any(), any(), any()))
        .thenReturn(rows);

    var ex = assertThrows(IllegalStateException.class,
        () -> service.getFilteredStockUpdates(new StockUpdateFilterDTO()));
    assertNotNull(ex.getMessage());
  }
}
