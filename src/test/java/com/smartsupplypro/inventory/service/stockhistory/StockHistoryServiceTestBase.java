package com.smartsupplypro.inventory.service.stockhistory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * Shared fixture for StockHistoryService unit tests.
 *
 * <p><strong>Intent</strong>: keep test classes small by centralizing common constants, default
 * repository stubs, and mapper assertions.</p>
 */
@SuppressWarnings("unused")
abstract class StockHistoryServiceTestBase {

    protected static final String ITEM_1 = "item-1";
    protected static final String ITEM_2 = "new-id";
    protected static final String SUPPLIER_1 = "S1";
    protected static final String SUPPLIER_2 = "S2";
    protected static final String ADMIN = "admin";

    @Mock
    protected StockHistoryRepository repository;

    @Mock
    protected InventoryItemRepository itemRepository;

    @InjectMocks
    protected StockHistoryService service;

    /**
     * Initializes mock objects before each test case.
     * Sets up default mock behavior for common inventory items.
     */
    @BeforeEach
    void setUpBase() {
        when(itemRepository.findById(ITEM_1)).thenReturn(Optional.of(mkItem(ITEM_1, SUPPLIER_1)));
        when(itemRepository.findById(ITEM_2)).thenReturn(Optional.of(mkItem(ITEM_2, SUPPLIER_2)));
    }

    protected static com.smartsupplypro.inventory.model.InventoryItem mkItem(String id, String supplierId) {
        var it = new com.smartsupplypro.inventory.model.InventoryItem();
        it.setId(id);
        it.setSupplierId(supplierId);
        return it;
    }

    protected static StockHistory mkHistory(
            String id,
            String itemId,
            String supplierId,
            int change,
            StockChangeReason reason,
            String createdBy,
            LocalDateTime timestamp,
            BigDecimal priceAtChange) {
        return StockHistory.builder()
                .id(id)
                .itemId(itemId)
                .supplierId(supplierId)
                .change(change)
                .reason(reason)
                .createdBy(createdBy)
                .timestamp(timestamp)
                .priceAtChange(priceAtChange)
                .build();
    }

    protected static void assertDto(
            StockHistoryDTO dto,
            String itemId,
            int change,
            StockChangeReason reason,
            String createdBy,
            LocalDateTime timestamp,
            BigDecimal priceAtChange) {
        org.junit.jupiter.api.Assertions.assertEquals(itemId, dto.getItemId());
        org.junit.jupiter.api.Assertions.assertEquals(change, dto.getChange());
        org.junit.jupiter.api.Assertions.assertEquals(reason.name(), dto.getReason());
        org.junit.jupiter.api.Assertions.assertEquals(createdBy, dto.getCreatedBy());
        org.junit.jupiter.api.Assertions.assertEquals(timestamp, dto.getTimestamp());
        org.junit.jupiter.api.Assertions.assertEquals(priceAtChange, dto.getPriceAtChange());
    }

    protected StockHistory captureSavedHistory() {
        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }
}
