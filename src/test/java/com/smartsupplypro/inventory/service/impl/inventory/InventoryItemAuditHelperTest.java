package com.smartsupplypro.inventory.service.impl.inventory;

import java.math.BigDecimal;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * Unit tests for {@link InventoryItemAuditHelper}.
 *
 * <p><strong>Why this suite exists</strong>:</p>
 * <ul>
 *   <li>Audit logging is business-critical and should not be left uncovered.</li>
 *   <li>Service tests often mock this helper, which can hide regressions in logging semantics.</li>
 * </ul>
 *
 * <p><strong>What is validated</strong>:</p>
 * <ul>
 *   <li>Correct reason and delta selection</li>
 *   <li>SecurityContext username usage and fallback behavior</li>
 *   <li>Conditional behavior for quantity changes (delta=0 => no log)</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class InventoryItemAuditHelperTest {

    @Mock private StockHistoryService stockHistoryService;

    @InjectMocks private InventoryItemAuditHelper helper;

    @AfterEach
    @SuppressWarnings("unused")
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void logInitialStock_usesInitialStockReason_andAuthenticatedUsername() {
        // GIVEN
        authenticateAs("admin");
        InventoryItem item = item("item-1", 5, new BigDecimal("12.50"));

        // WHEN
        helper.logInitialStock(item);

        // THEN
        ArgumentCaptor<String> itemId = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Integer> delta = ArgumentCaptor.forClass(Integer.class);
        ArgumentCaptor<StockChangeReason> reason = ArgumentCaptor.forClass(StockChangeReason.class);
        ArgumentCaptor<String> user = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<BigDecimal> price = ArgumentCaptor.forClass(BigDecimal.class);

        verify(stockHistoryService).logStockChange(itemId.capture(), delta.capture(), reason.capture(), user.capture(), price.capture());

        assertEquals("item-1", itemId.getValue());
        assertEquals(5, delta.getValue());
        assertEquals(StockChangeReason.INITIAL_STOCK, reason.getValue());
        assertEquals("admin", user.getValue());
        assertEquals(new BigDecimal("12.50"), price.getValue());
    }

    @Test
    void logQuantityChange_doesNotLog_whenDeltaIsZero() {
        // GIVEN
        authenticateAs("admin");
        InventoryItem item = item("item-1", 5, new BigDecimal("10.00"));

        // WHEN
        helper.logQuantityChange(item, 0);

        // THEN
        verify(stockHistoryService, never()).logStockChange(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void logQuantityChange_logsManualUpdate_whenDeltaNonZero() {
        // GIVEN
        authenticateAs("admin");
        InventoryItem item = item("item-1", 5, new BigDecimal("10.00"));

        // WHEN
        helper.logQuantityChange(item, -2);

        // THEN
        verify(stockHistoryService).logStockChange(
                "item-1",
                -2,
                StockChangeReason.MANUAL_UPDATE,
                "admin",
                new BigDecimal("10.00")
        );
    }

    @Test
    void logQuantityAdjustment_logsProvidedReason() {
        // GIVEN
        authenticateAs("admin");
        InventoryItem item = item("item-1", 5, new BigDecimal("10.00"));

        // WHEN
        helper.logQuantityAdjustment(item, 3, StockChangeReason.RETURNED_BY_CUSTOMER);

        // THEN
        verify(stockHistoryService).logStockChange(
                "item-1",
                3,
            StockChangeReason.RETURNED_BY_CUSTOMER,
                "admin",
                new BigDecimal("10.00")
        );
    }

    @Test
    void logPriceChange_logsPriceChangeReason_andZeroDelta() {
        // GIVEN
        authenticateAs("admin");

        // WHEN
        helper.logPriceChange("item-1", new BigDecimal("99.99"));

        // THEN
        verify(stockHistoryService).logStockChange(
                "item-1",
                0,
                StockChangeReason.PRICE_CHANGE,
                "admin",
                new BigDecimal("99.99")
        );
    }

    @Test
    void logFullRemoval_logsNegativeQuantity_andProvidedReason() {
        // GIVEN
        authenticateAs("admin");
        InventoryItem item = item("item-1", 7, new BigDecimal("10.00"));

        // WHEN
        helper.logFullRemoval(item, StockChangeReason.SCRAPPED);

        // THEN
        verify(stockHistoryService).logStockChange(
                "item-1",
                -7,
                StockChangeReason.SCRAPPED,
                "admin",
                new BigDecimal("10.00")
        );
    }

    @Test
    void usernameFallsBackToSystem_whenNoAuthenticationPresent() {
        // GIVEN
        SecurityContextHolder.clearContext();

        // WHEN
        helper.logPriceChange("item-1", new BigDecimal("1.00"));

        // THEN
        verify(stockHistoryService).logStockChange(
                "item-1",
                0,
                StockChangeReason.PRICE_CHANGE,
                "system",
                new BigDecimal("1.00")
        );
    }

    private static InventoryItem item(String id, int qty, BigDecimal price) {
        InventoryItem item = new InventoryItem();
        item.setId(id);
        item.setQuantity(qty);
        item.setPrice(price);
        return item;
    }

    private static void authenticateAs(String username) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new TestingAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }
}
