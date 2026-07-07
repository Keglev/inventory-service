package com.smartsupplypro.inventory.service.impl.inventory;

import java.math.BigDecimal;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Nested;
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
 * Unit tests for {@link InventoryItemAuditHelper} business logic and exception handling behavior.
 */
@ExtendWith(MockitoExtension.class)
class InventoryItemAuditHelperTest {

    @Mock private StockHistoryService stockHistoryService;
    @InjectMocks private InventoryItemAuditHelper helper;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Tests for {@code logInitialStock()}.
     */
    @Nested
    class LogInitialStock {

        @Test
        void should_log_initial_stock_reason_with_authenticated_username() {
            authenticateAs("admin");
            InventoryItem item = item("item-1", 5, new BigDecimal("12.50"));

            helper.logInitialStock(item);

            ArgumentCaptor<String>            itemId = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<Integer>           delta  = ArgumentCaptor.forClass(Integer.class);
            ArgumentCaptor<StockChangeReason> reason = ArgumentCaptor.forClass(StockChangeReason.class);
            ArgumentCaptor<String>            user   = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<BigDecimal>        price  = ArgumentCaptor.forClass(BigDecimal.class);

            verify(stockHistoryService).logStockChange(
                    itemId.capture(), delta.capture(), reason.capture(), user.capture(), price.capture());

            assertEquals("item-1",                        itemId.getValue());
            assertEquals(5,                               delta.getValue());
            assertEquals(StockChangeReason.INITIAL_STOCK, reason.getValue());
            assertEquals("admin",                         user.getValue());
            assertEquals(new BigDecimal("12.50"),         price.getValue());
        }
    }

    /**
     * Tests for {@code logQuantityChange()} and {@code logQuantityAdjustment()}.
     */
    @Nested
    class LogQuantityChange {

        @Test
        void should_not_log_when_delta_is_zero() {
            authenticateAs("admin");
            helper.logQuantityChange(item("item-1", 5, new BigDecimal("10.00")), 0);
            verify(stockHistoryService, never()).logStockChange(
                    org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyInt(),
                    org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any(),
                    org.mockito.ArgumentMatchers.any());
        }

        @Test
        void should_log_manual_update_reason_when_delta_is_non_zero() {
            authenticateAs("admin");
            helper.logQuantityChange(item("item-1", 5, new BigDecimal("10.00")), -2);
            verify(stockHistoryService).logStockChange(
                    "item-1", -2, StockChangeReason.MANUAL_UPDATE, "admin", new BigDecimal("10.00"));
        }

        @Test
        void should_log_provided_reason_for_quantity_adjustment() {
            authenticateAs("admin");
            helper.logQuantityAdjustment(item("item-1", 5, new BigDecimal("10.00")),
                    3, StockChangeReason.RETURNED_BY_CUSTOMER);
            verify(stockHistoryService).logStockChange(
                    "item-1", 3, StockChangeReason.RETURNED_BY_CUSTOMER, "admin", new BigDecimal("10.00"));
        }
    }

    /**
     * Tests for {@code logPriceChange()}.
     */
    @Nested
    class LogPriceChange {

        @Test
        void should_log_price_change_reason_with_zero_delta() {
            authenticateAs("admin");
            helper.logPriceChange("item-1", new BigDecimal("99.99"));
            verify(stockHistoryService).logStockChange(
                    "item-1", 0, StockChangeReason.PRICE_CHANGE, "admin", new BigDecimal("99.99"));
        }

        @Test
        void should_fall_back_to_system_username_when_no_authentication_present() {
            SecurityContextHolder.clearContext();
            helper.logPriceChange("item-1", new BigDecimal("1.00"));
            verify(stockHistoryService).logStockChange(
                    "item-1", 0, StockChangeReason.PRICE_CHANGE, "system", new BigDecimal("1.00"));
        }
    }

    private static InventoryItem item(String id, int qty, BigDecimal price) {
        InventoryItem item = new InventoryItem();
        item.setId(id); item.setQuantity(qty); item.setPrice(price);
        return item;
    }

    private static void authenticateAs(String username) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new TestingAuthenticationToken(username, null));
        SecurityContextHolder.setContext(context);
    }
}
