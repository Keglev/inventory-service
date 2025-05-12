package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import org.springframework.test.context.ActiveProfiles;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import org.mockito.*;

import java.util.Optional;
import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@ActiveProfiles("test")
public class InventoryItemServiceTest {

    @InjectMocks
    private InventoryItemService inventoryItemService;

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private StockHistoryService stockHistoryService;

    @Mock
    private SupplierRepository supplierRepository;

    private InventoryItemDTO dto;
    private InventoryItem entity;

    @BeforeEach
    void setUp() {
        dto = new InventoryItemDTO();
        dto.setId("item-1");
        dto.setName("SSD");
        dto.setQuantity(50);
        dto.setPrice(new BigDecimal("120.00"));
        dto.setSupplierId("supplier-1");
        dto.setCreatedBy("admin");

        entity = InventoryItemMapper.toEntity(dto);

        when(supplierRepository.existsById(anyString())).thenReturn(true);
        when(inventoryItemRepository.findById(anyString())).thenReturn(Optional.of(entity));
        when(inventoryItemRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void testSave_callsStockHistoryServiceWithInitialStock() {
        InventoryItemDTO result = inventoryItemService.save(dto);

        assertNotNull(result);
        verify(inventoryItemRepository).save(any(InventoryItem.class));
        verify(stockHistoryService).logStockChange(
                eq("item-1"), eq(50), eq(StockChangeReason.INITIAL_STOCK), eq("admin")
        );
    }

    @Test
    void testUpdate_withQuantityChange_callsStockHistoryService() {
        InventoryItem existing = InventoryItemMapper.toEntity(dto);
        existing.setQuantity(30);
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(existing));

        dto.setQuantity(50);

        Optional<InventoryItemDTO> result = inventoryItemService.update("item-1", dto);

        assertTrue(result.isPresent());
        verify(stockHistoryService).logStockChange(eq("item-1"), eq(20), eq(StockChangeReason.MANUAL_UPDATE), eq("admin"));
    }

    @Test
    void testUpdate_withoutQuantityChange_doesNotCallStockHistoryService() {
        InventoryItem existing = InventoryItemMapper.toEntity(dto);
        existing.setQuantity(50);
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(existing));

        Optional<InventoryItemDTO> result = inventoryItemService.update("item-1", dto);

        assertTrue(result.isPresent());
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
    }

    @Test
    void testDelete_shouldCallRepositoryDeleteById() {
        inventoryItemService.delete("item-1", StockChangeReason.SCRAPPED);

        verify(stockHistoryService).logStockChange("item-1", -50, StockChangeReason.SCRAPPED, "admin");
        verify(inventoryItemRepository).deleteById("item-1");
    }

    @Test
    void testGetById_whenItemExists_shouldReturnDTO() {
        Optional<InventoryItemDTO> result = inventoryItemService.getById("item-1");

        assertTrue(result.isPresent());
        assertEquals("SSD", result.get().getName());
    }

    @Test
    void testGetById_whenItemDoesNotExist_shouldReturnEmptyOptional() {
        when(inventoryItemRepository.findById("item-999")).thenReturn(Optional.empty());

        Optional<InventoryItemDTO> result = inventoryItemService.getById("item-999");

        assertFalse(result.isPresent());
    }

    @Test
    void testUpdate_whenItemNotFound_shouldReturnEmptyOptional() {
        when(inventoryItemRepository.findById("invalid-id")).thenReturn(Optional.empty());

        Optional<InventoryItemDTO> result = inventoryItemService.update("invalid-id", dto);

        assertFalse(result.isPresent());
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
    }

    @Test
    void testSave_withNullName_shouldThrowException() {
        dto.setName(null);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Product name cannot be null or empty", ex.getMessage());
    }

    @Test
    void testSave_withNegativeQuantity_shouldThrowException() {
        dto.setQuantity(-5);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Quantity cannot be negative", ex.getMessage());
    }

    @Test
    void testSave_withNegativePrice_shouldThrowException() {
        dto.setPrice(new BigDecimal("-10.00"));

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Price must be positive", ex.getMessage());
    }

    @Test
    void testSave_withNullSupplierId_shouldThrowException() {
        dto.setSupplierId(null);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Supplier ID must be provided", ex.getMessage());
    }

    @Test
    void testValidateSupplierExists_withNonExistingSupplier_shouldThrow() {
        when(supplierRepository.existsById("invalid-supplier")).thenReturn(false);

        InventoryItemDTO invalidDto = InventoryItemMapper.toDTO(entity);
        invalidDto.setSupplierId("invalid-supplier");

        Exception e = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(invalidDto));
        assertEquals("Supplier does not exist", e.getMessage());
    }

    @Test
    void testDelete_withValidReason_shouldDeleteAndLog() {
        inventoryItemService.delete("item-1", StockChangeReason.DESTROYED);

        verify(stockHistoryService).logStockChange("item-1", -50, StockChangeReason.DESTROYED, "admin");
        verify(inventoryItemRepository).deleteById("item-1");
    }

    @Test
    void testDelete_withInvalidReason_shouldThrowException() {
        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            inventoryItemService.delete("item-1", StockChangeReason.SOLD)
        );

        assertEquals("Invalid reason for deletion", ex.getMessage());
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
        verify(inventoryItemRepository, never()).deleteById(any());
    }

    @Test
    void testDelete_nonExistingItem_shouldThrowException() {
        when(inventoryItemRepository.findById("invalid-id")).thenReturn(Optional.empty());

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            inventoryItemService.delete("invalid-id", StockChangeReason.DESTROYED)
        );

        assertEquals("Item not found", ex.getMessage());
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
        verify(inventoryItemRepository, never()).deleteById(any());
    }

    @Test
    void shouldThrowExceptionWhenInventoryItemAlreadyExists() {
        when(inventoryItemRepository.existsByNameIgnoreCase("Widget")).thenReturn(true);

        InventoryItemDTO duplicate = InventoryItemDTO.builder()
            .name("Widget")
            .price(BigDecimal.valueOf(10.0))
            .quantity(5)
            .supplierId("some-supplier")
            .createdBy("tester")
            .build();

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            inventoryItemService.save(duplicate)
        );

        assertEquals("An inventory item with this name already exists.", ex.getMessage());
    }

}
