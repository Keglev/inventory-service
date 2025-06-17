package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import org.springframework.test.context.ActiveProfiles;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ActiveProfiles("test")
public class StockHistoryServiceTest {

    @Mock
    private StockHistoryRepository repository;

    @InjectMocks
    private StockHistoryService stockHistoryService;
    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testLogStockChange_withValidReason_shouldSaveStockHistory() {
        stockHistoryService.logStockChange("item-1", 10, StockChangeReason.SOLD, "admin");

        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());

        StockHistory saved = captor.getValue();
        assertEquals("item-1", saved.getItemId());
        assertEquals(10, saved.getChange());
        assertEquals("SOLD", saved.getReason());
        assertEquals("admin", saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }
    
    @Test
    void testLogStockChange_withInvalidReason_shouldThrowException() {
        Exception ex = assertThrows(IllegalArgumentException.class, () -> {
            stockHistoryService.logStockChange("item-1", 5, null, "admin");
        });

        assertTrue(ex.getMessage().contains("Invalid stock change reason"));
    }

    @Test
    void testLogStockChange_withNegativeChange_shouldSaveNormally() {
        stockHistoryService.logStockChange("item-1", -5, StockChangeReason.SCRAPPED, "admin");

        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());

        StockHistory saved = captor.getValue();
        assertEquals("item-1", saved.getItemId());
        assertEquals(-5, saved.getChange());
        assertEquals("SCRAPPED", saved.getReason());
        assertEquals("admin", saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    @Test
    void testLogStockChange_withBlankCreatedBy_shouldThrow() {
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            stockHistoryService.logStockChange("item-1", 5, StockChangeReason.SOLD, " ")
        );

        assertEquals("CreatedBy is required", ex.getMessage());
    }

    @Test
    void testLogStockChange_withZeroChange_shouldThrow() {
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            stockHistoryService.logStockChange("item-1", 0, StockChangeReason.SOLD, "admin")
        );

        assertEquals("Change amount must be non-zero", ex.getMessage());
    }

    @Test
    void testLogStockChange_withNullItemId_shouldThrow() {
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            stockHistoryService.logStockChange(" ", 5, StockChangeReason.SOLD, "admin")
        );

        assertEquals("Item ID cannot be null or empty", ex.getMessage());
    }

    @Test
    void testLogStockChange_withNullCreatedBy_shouldThrow() {
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            stockHistoryService.logStockChange("item-1", 5, StockChangeReason.SOLD, null)
        );
        assertEquals("CreatedBy is required", ex.getMessage());
    }

}
