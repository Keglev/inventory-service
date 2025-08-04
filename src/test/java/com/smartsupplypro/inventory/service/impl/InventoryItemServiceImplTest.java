package com.smartsupplypro.inventory.service.impl;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplTest {

    @Mock
    private InventoryItemRepository repository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private StockHistoryService stockHistoryService;

    @InjectMocks
    private InventoryItemServiceImpl service;

    private InventoryItemDTO validDto;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);

        validDto = InventoryItemDTO.builder()
                .name("Item 1")
                .price(BigDecimal.valueOf(10.0))
                .quantity(100)
                .minimumQuantity(10)
                .supplierId("supplier-1")
                .createdBy("admin")
                .build();
    }

    @Test
    void save_shouldReturnSavedItem() {
        InventoryItem entity = InventoryItemMapper.toEntity(validDto);
        entity.setId("item-1");

        when(supplierRepository.existsById("supplier-1")).thenReturn(true);
        when(repository.existsByNameAndPrice("Item 1", BigDecimal.valueOf(10.0))).thenReturn(false);
        when(repository.save(any(InventoryItem.class))).thenReturn(entity);

        InventoryItemDTO result = service.save(validDto);

        assertNotNull(result);
        assertEquals("Item 1", result.getName());
        verify(stockHistoryService).logStockChange(eq("item-1"), eq(100), eq(StockChangeReason.INITIAL_STOCK), eq("admin"));
    }

    @Test
    void save_shouldThrow_whenNameIsMissing() {
        validDto.setName(null);
        assertThrows(IllegalArgumentException.class, () -> service.save(validDto));
    }

    @Test
    void update_shouldUpdateAndReturnDTO() {
        InventoryItem existing = InventoryItemMapper.toEntity(validDto);
        existing.setId("item-1");

        when(supplierRepository.existsById("supplier-1")).thenReturn(true);
        when(repository.findById("item-1")).thenReturn(Optional.of(existing));
        when(repository.existsByNameAndPrice("Item 1", BigDecimal.valueOf(10.0))).thenReturn(false);
        when(repository.save(any())).thenReturn(existing);

        Optional<InventoryItemDTO> updated = service.update("item-1", validDto);

        assertTrue(updated.isPresent());
        assertEquals("Item 1", updated.get().getName());
    }

    @Test
    void update_shouldThrow_whenNotFound() {
        when(repository.findById("invalid-id")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.update("invalid-id", validDto));
    }

    @Test
    void delete_shouldRemoveItemAndRecordHistory() {
        InventoryItem entity = InventoryItemMapper.toEntity(validDto);
        entity.setId("item-1");

        when(repository.findById("item-1")).thenReturn(Optional.of(entity));

        service.delete("item-1", StockChangeReason.SCRAPPED);

        verify(stockHistoryService).logStockChange(eq("item-1"), eq(-100), eq(StockChangeReason.SCRAPPED), eq("admin"));
        verify(repository).deleteById("item-1");
    }

    @Test
    void delete_shouldThrow_whenItemNotFound() {
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.delete("missing-id", StockChangeReason.SCRAPPED));
    }

    @Test
    void findByNameSortedByPrice_shouldReturnPagedResults() {
        Pageable pageable = PageRequest.of(0, 2);

        InventoryItem item1 = InventoryItem.builder()
                .id("id-1")
                .name("Test Widget")
                .price(BigDecimal.valueOf(5.0))
                .quantity(10)
                .minimumQuantity(5)
                .supplierId("supplier-1")
                .createdBy("admin")
                .build();

        InventoryItem item2 = InventoryItem.builder()
                .id("id-2")
                .name("Test Widget")
                .price(BigDecimal.valueOf(9.99))
                .quantity(20)
                .minimumQuantity(5)
                .supplierId("supplier-2")
                .createdBy("admin")
                .build();

        Page<InventoryItem> mockPage = new PageImpl<>(List.of(item1, item2), pageable, 2);
        when(repository.findByNameSortedByPrice(anyString(), any(Pageable.class))).thenReturn(mockPage);

        Page<InventoryItemDTO> result = service.findByNameSortedByPrice("Test Widget", pageable);

        assertNotNull(result);
        assertEquals(2, result.getContent().size());
        assertEquals("id-1", result.getContent().get(0).getId());
        assertEquals("id-2", result.getContent().get(1).getId());
    }
}
