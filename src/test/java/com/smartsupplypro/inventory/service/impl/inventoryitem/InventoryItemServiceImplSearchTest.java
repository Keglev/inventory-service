package com.smartsupplypro.inventory.service.impl.inventoryitem;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;

/**
 * Unit tests for {@link InventoryItemServiceImpl#findByNameSortedByPrice(String, org.springframework.data.domain.Pageable)}
 * covering pagination delegation and DTO mapping.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@SuppressWarnings("unused")
class InventoryItemServiceImplSearchTest {

    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @SuppressWarnings("FieldMayBeFinal")
    @Spy  private InventoryItemMapper inventoryItemMapper = new InventoryItemMapper();
    @InjectMocks private InventoryItemServiceImpl service;

    @BeforeEach
    void setup() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");
        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
    }

    @Test
    void should_delegate_to_repository_and_map_results_to_dtos() {
        InventoryItem e1 = new InventoryItem();
        e1.setId("i-1"); e1.setName("AAA");
        e1.setPrice(new BigDecimal("10.00")); e1.setQuantity(5);
        e1.setMinimumQuantity(1); e1.setSupplierId("S1");

        InventoryItem e2 = new InventoryItem();
        e2.setId("i-2"); e2.setName("BBB");
        e2.setPrice(new BigDecimal("20.00")); e2.setQuantity(7);
        e2.setMinimumQuantity(1); e2.setSupplierId("S1");

        when(repository.findByNameSortedByPrice(anyString(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(e1, e2)));

        var result = service.findByNameSortedByPrice("z", PageRequest.of(0, 10));

        assertEquals(2, result.getTotalElements());
        assertEquals("i-1", result.getContent().get(0).getId());
        assertEquals(new BigDecimal("10.00"), result.getContent().get(0).getPrice());
    }

    @Test
    void should_return_empty_page_when_repository_returns_null() {
        when(repository.findByNameSortedByPrice(anyString(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(null);

        Page<?> result = service.findByNameSortedByPrice("anything", PageRequest.of(0, 10));

        assertEquals(0, result.getTotalElements());
        assertEquals(0, result.getContent().size());
    }
}
