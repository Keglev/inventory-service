package com.smartsupplypro.inventory.service.stockhistory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.impl.StockHistoryServiceImpl;

/**
 * Unit tests for {@link com.smartsupplypro.inventory.service.StockHistoryService}
 * logStockChange validation, persistence, and rejection behavior.
 */
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
class StockHistoryServiceLogTest {

    private static final String ITEM_1   = "item-1";
    private static final String SUPPLIER_1 = "S1";
    private static final String ADMIN    = "admin";

    @Mock
    private StockHistoryRepository repository;

    @Mock
    private InventoryItemRepository itemRepository;

    @InjectMocks
    private StockHistoryServiceImpl service;

    /** Stubs the item lookup that logStockChange makes once its inputs are valid. */
    private void givenItemExists(String id, String supplierId) {
        when(itemRepository.findById(id)).thenReturn(Optional.of(mkItem(id, supplierId)));
    }

    private static com.smartsupplypro.inventory.model.InventoryItem mkItem(String id, String supplierId) {
        var it = new com.smartsupplypro.inventory.model.InventoryItem();
        it.setId(id);
        it.setSupplierId(supplierId);
        return it;
    }

    private StockHistory captureSavedHistory() {
        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void should_persist_stock_change_when_reason_and_positive_delta_are_valid() {
        givenItemExists(ITEM_1, SUPPLIER_1);
        service.logStockChange(ITEM_1, 10, StockChangeReason.SOLD, ADMIN, null);

        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(10, saved.getChange());
        assertEquals(StockChangeReason.SOLD, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }


    @Test
    void should_persist_negative_change_when_delta_is_negative() {
        givenItemExists(ITEM_1, SUPPLIER_1);
        service.logStockChange(ITEM_1, -5, StockChangeReason.SCRAPPED, ADMIN, null);

        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(-5, saved.getChange());
        assertEquals(StockChangeReason.SCRAPPED, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    @Test
    void should_assign_distinct_ids_when_changes_are_logged_back_to_back() {
        // update() logs price and quantity within one millisecond; a clock-based
        // id made the second save merge into the first row.
        givenItemExists(ITEM_1, SUPPLIER_1);
        int writes = 200;
        for (int i = 0; i < writes; i++) {
            service.logStockChange(ITEM_1, 1, StockChangeReason.SOLD, ADMIN, null);
        }

        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository, times(writes)).save(captor.capture());
        List<String> ids = captor.getAllValues().stream().map(StockHistory::getId).toList();
        assertEquals(writes, ids.stream().distinct().count());
    }

    static Stream<Arguments> invalidLogStockChangeCases() {
        BigDecimal price = new BigDecimal("120.00");
        return Stream.of(
                Arguments.of("blank createdBy",  ITEM_1, 5,  StockChangeReason.MANUAL_UPDATE, "  ",  price, "createdby"),
                Arguments.of("null createdBy",   ITEM_1, 5,  StockChangeReason.MANUAL_UPDATE, null,  price, "createdby"),
                Arguments.of("zero change",       ITEM_1, 0,  StockChangeReason.MANUAL_UPDATE, ADMIN, price, "zero"),
                Arguments.of("null itemId",       null,   10, StockChangeReason.MANUAL_UPDATE, ADMIN, price, "item id"),
                Arguments.of("null reason",       ITEM_1, 5,  null,                          ADMIN, price, "reason")
        );
    }

    @ParameterizedTest(name = "logStockChange invalid: {0}")
    @MethodSource("invalidLogStockChangeCases")
    void should_throw_and_not_persist_when_inputs_are_invalid(
            String _case, String itemId, int change, StockChangeReason reason,
            String createdBy, BigDecimal priceAtChange, String expectedMessageContainsLower) {
        var ex = assertThrows(InvalidRequestException.class,
                () -> service.logStockChange(itemId, change, reason, createdBy, priceAtChange));
        assertTrue(ex.getMessage().toLowerCase().contains(expectedMessageContainsLower));
        verifyNoInteractions(repository);
    }
}
