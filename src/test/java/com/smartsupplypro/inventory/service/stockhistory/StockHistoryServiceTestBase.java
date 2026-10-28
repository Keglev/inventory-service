package com.smartsupplypro.inventory.service.stockhistory;

import java.util.Optional;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.impl.StockHistoryServiceImpl;


/**
 * Shared fixture for {@link StockHistoryService} unit tests.
 */
abstract class StockHistoryServiceTestBase {

    protected static final String ITEM_1   = "item-1";
    protected static final String SUPPLIER_1 = "S1";
    protected static final String ADMIN    = "admin";

    @Mock
    protected StockHistoryRepository repository;

    @Mock
    protected InventoryItemRepository itemRepository;

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

    protected StockHistory captureSavedHistory() {
        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }
}
