package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * Tests for {@link InventoryItemServiceImpl} search and paging operations.
 * Covers repository delegation and DTO mapping for paginated results.
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplSearchTest {
    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    @InjectMocks private InventoryItemServiceImpl service;

    @BeforeEach
    void setup() {
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");
        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
    }

    @Test
    @DisplayName("findByNameSortedByPrice: delegates to repository and maps to DTO")
    void findByNameSortedByPrice_delegatesToRepository() {
        InventoryItem e1 = new InventoryItem();
        e1.setId("i-1");
        e1.setName("AAA");
        e1.setPrice(new BigDecimal("10.00"));
        e1.setQuantity(5);
        e1.setMinimumQuantity(1);
        e1.setSupplierId("S1");

        InventoryItem e2 = new InventoryItem();
        e2.setId("i-2");
        e2.setName("BBB");
        e2.setPrice(new BigDecimal("20.00"));
        e2.setQuantity(7);
        e2.setMinimumQuantity(1);
        e2.setSupplierId("S1");

        var page = new PageImpl<>(List.of(e1, e2));
        when(repository.findByNameSortedByPrice(anyString(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        var result = service.findByNameSortedByPrice("z", PageRequest.of(0, 10));

        assertEquals(2, result.getTotalElements());
        assertEquals("i-1", result.getContent().get(0).getId());
        assertEquals(new BigDecimal("10.00"), result.getContent().get(0).getPrice());
    }
}
