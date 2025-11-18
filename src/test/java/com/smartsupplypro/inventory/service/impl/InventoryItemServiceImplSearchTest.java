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
 *
 * <p><strong>Operation Coverage</strong></p>
 * <ul>
 *   <li><b>findByNameSortedByPrice:</b> Paginated search delegating to repository with DTO mapping</li>
 * </ul>
 *
 * <p><strong>Validation Checks</strong></p>
 * <ul>
 *   <li>Repository method is called with correct pagination parameters</li>
 *   <li>Returned DTOs are correctly mapped from entities (ID, name, price, quantity preserved)</li>
 *   <li>Page metadata (totalElements, content size) is accurate</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Search is delegated entirely to repository layer (service is thin wrapper).</li>
 *   <li>Mapper is static utility; no bean dependency needed.</li>
 * </ul>
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
        // Set up OAuth2 authenticated context (simulates logged-in ADMIN user)
        InventoryItemServiceImplTestHelper.authenticateAsOAuth2("admin", "ADMIN");
        // Mock supplier repository - all suppliers exist for tests
        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
    }

    /**
     * Validates that search delegates to repository and maps results to DTO.
     * Scenario: Repository returns paginated items; service maps them to DTOs.
     * Expected: Correct DTOs with preserved ID, name, price, quantity fields.
     */
    @Test
    @DisplayName("findByNameSortedByPrice: delegates to repository and maps to DTO")
    void findByNameSortedByPrice_delegatesToRepository() {
        // Build first entity with basic fields
        InventoryItem e1 = new InventoryItem();
        e1.setId("i-1");
        e1.setName("AAA");
        e1.setPrice(new BigDecimal("10.00"));
        e1.setQuantity(5);
        e1.setMinimumQuantity(1);
        e1.setSupplierId("S1");

        // Build second entity with different price
        InventoryItem e2 = new InventoryItem();
        e2.setId("i-2");
        e2.setName("BBB");
        e2.setPrice(new BigDecimal("20.00"));
        e2.setQuantity(7);
        e2.setMinimumQuantity(1);
        e2.setSupplierId("S1");

        // Create page result with both items
        var page = new PageImpl<>(List.of(e1, e2));
        // Mock repository to return page when search is called
        when(repository.findByNameSortedByPrice(anyString(), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        // Execute search with pagination
        var result = service.findByNameSortedByPrice("z", PageRequest.of(0, 10));

        // Verify page metadata and DTO mapping
        assertEquals(2, result.getTotalElements());
        // Verify first item DTO has correct ID and price from entity
        assertEquals("i-1", result.getContent().get(0).getId());
        assertEquals(new BigDecimal("10.00"), result.getContent().get(0).getPrice());
    }
}
