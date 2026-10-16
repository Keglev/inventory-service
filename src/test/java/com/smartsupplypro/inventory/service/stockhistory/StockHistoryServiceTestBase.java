package com.smartsupplypro.inventory.service.stockhistory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.StockHistoryMapper;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.impl.StockHistoryServiceImpl;


/**
 * Shared fixture for {@link StockHistoryService} unit tests.
 */
abstract class StockHistoryServiceTestBase {

    protected static final String ITEM_1   = "item-1";
    protected static final String ITEM_2   = "new-id";
    protected static final String SUPPLIER_1 = "S1";
    protected static final String SUPPLIER_2 = "S2";
    protected static final String ADMIN    = "admin";

    @Mock
    protected StockHistoryRepository repository;

    @Mock
    protected InventoryItemRepository itemRepository;

    @Spy
    protected StockHistoryMapper mapper = new StockHistoryMapper();

    @InjectMocks
    protected StockHistoryServiceImpl service;

    /** Stubs the item lookup that logStockChange makes once its inputs are valid. */
    protected void givenItemExists(String id, String supplierId) {
        when(itemRepository.findById(id)).thenReturn(Optional.of(mkItem(id, supplierId)));
    }

    protected static com.smartsupplypro.inventory.model.InventoryItem mkItem(String id, String supplierId) {
        var it = new com.smartsupplypro.inventory.model.InventoryItem();
        it.setId(id);
        it.setSupplierId(supplierId);
        return it;
    }

    protected static StockHistory mkHistory(
            String id, String itemId, String supplierId,
            int change, StockChangeReason reason,
            String createdBy, LocalDateTime timestamp, BigDecimal priceAtChange) {
        return StockHistory.builder()
                .id(id).itemId(itemId).supplierId(supplierId)
                .change(change).reason(reason).createdBy(createdBy)
                .timestamp(timestamp).priceAtChange(priceAtChange)
                .build();
    }

    protected static void assertDto(
            StockHistoryDTO dto, String itemId, int change, StockChangeReason reason,
            String createdBy, LocalDateTime timestamp, BigDecimal priceAtChange) {
        org.junit.jupiter.api.Assertions.assertEquals(itemId, dto.itemId());
        org.junit.jupiter.api.Assertions.assertEquals(change, dto.change());
        org.junit.jupiter.api.Assertions.assertEquals(reason.name(), dto.reason());
        org.junit.jupiter.api.Assertions.assertEquals(createdBy, dto.createdBy());
        org.junit.jupiter.api.Assertions.assertEquals(timestamp, dto.timestamp());
        org.junit.jupiter.api.Assertions.assertEquals(priceAtChange, dto.priceAtChange());
    }

    protected StockHistory captureSavedHistory() {
        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }
}
