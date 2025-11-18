package com.smartsupplypro.inventory.service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;

/**
 * Delete and query operation tests for {@link InventoryItemServiceImpl}.
 *
 * <p><strong>Operation Coverage:</strong></p>
 * <ul>
 *   <li><b>delete:</b> Remove items with deletion reason validation and history logging</li>
 *   <li><b>getById:</b> Retrieve item by ID or return empty if not found</li>
 * </ul>
 *
 * <p><strong>Validation Rules:</strong></p>
 * <ul>
 *   <li>Delete reason must be valid enum (DESTROYED, EXPIRED, RETURNED_TO_SUPPLIER)</li>
 *   <li>Item must exist before deletion</li>
 *   <li>Deletion reason determines audit trail entry</li>
 * </ul>
 *
 * <p><strong>Exception Mapping:</strong></p>
 * <ul>
 *   <li>Invalid delete reason → {@link IllegalArgumentException}</li>
 *   <li>Item not found → {@link IllegalArgumentException} for delete, empty Optional for getById</li>
 * </ul>
 *
 * <p><strong>Design Notes:</strong></p>
 * <ul>
 *   <li>auditHelper.logFullRemoval integrates with stockHistoryService internally.</li>
 *   <li>getById returns Optional for safe null handling by callers.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class InventoryItemServiceDeleteQueryTest {

    @InjectMocks
    private InventoryItemServiceImpl inventoryItemService;

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private StockHistoryService stockHistoryService;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper validationHelper;

    @Mock
    private com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper auditHelper;

    private InventoryItemDTO dto;
    private InventoryItem entity;

    @BeforeEach
    void setUp() {
        // Build test DTO with valid sample data
        dto = new InventoryItemDTO();
        dto.setId("item-1");
        dto.setName("SSD");
        dto.setQuantity(50);
        dto.setPrice(new BigDecimal("120.00"));
        dto.setSupplierId("supplier-1");
        dto.setCreatedBy("admin");

        // Convert DTO to entity for mock returns
        entity = InventoryItemMapper.toEntity(dto);

        // Default mocks: supplier exists, item found, validation passes
        when(supplierRepository.existsById(anyString())).thenReturn(true);
        when(inventoryItemRepository.findById(anyString())).thenReturn(Optional.of(entity));
        
        // Configure validation helper to return entity or throw if not found
        when(validationHelper.validateExists(anyString())).thenAnswer(invocation -> {
            String id = invocation.getArgument(0);
            return inventoryItemRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Item not found"));
        });
    }

    private void mockOAuth2Authentication(String email, String... roles) {
        // Create OAuth2 attributes with email
        Map<String, Object> attributes = Map.of("email", email);
        // Convert roles to GrantedAuthority collection
        Collection<GrantedAuthority> authorities = Arrays.stream(roles)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        // Create OAuth2User with email attribute as principal
        OAuth2User oauth2User = new DefaultOAuth2User(authorities, attributes, "email");
        // Create authentication token with OAuth2User principal
        Authentication auth = new TestingAuthenticationToken(oauth2User, null, authorities);
        // Set authentication in security context (simulates logged-in user)
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    /**
     * Validates that items with valid deletion reason are removed and logged.
     * Scenario: Deleting an existing item with a valid reason (DESTROYED).
     * Expected: auditHelper.logFullRemoval called and repository deleteById called.
     */
    @Test
    void testDelete_withValidReason_shouldDeleteAndLog() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        inventoryItemService.delete("item-1", StockChangeReason.DESTROYED);

        // Verify that audit helper was called (which internally calls stockHistoryService)
        verify(auditHelper).logFullRemoval(any(InventoryItem.class), eq(StockChangeReason.DESTROYED));
        // Verify repository delete was called
        verify(inventoryItemRepository).deleteById("item-1");
    }

    /**
     * Validates that invalid deletion reasons are rejected.
     * Scenario: Attempting to delete with SOLD reason (not valid for deletion).
     * Expected: {@link IllegalArgumentException} and no deletion.
     */
    @Test
    void testDelete_withInvalidReason_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryItemService.delete("item-1", StockChangeReason.SOLD)
        );

        assertEquals("Invalid reason for deletion", ex.getMessage());
        // Verify nothing was saved (validation rejected it early)
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
        // Verify delete was never called
        verify(inventoryItemRepository, never()).deleteById(any());
    }

    /**
     * Validates that deleting a non-existent item fails with 404.
     * Scenario: Item ID does not exist in repository.
     * Expected: {@link IllegalArgumentException} and no deletion attempt.
     */
    @Test
    void testDelete_nonExistingItem_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        when(inventoryItemRepository.findById("invalid-id")).thenReturn(Optional.empty());

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
                inventoryItemService.delete("invalid-id", StockChangeReason.DESTROYED)
        );

        assertEquals("Item not found", ex.getMessage());
        // Verify no history logged
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
        // Verify delete was never called
        verify(inventoryItemRepository, never()).deleteById(any());
    }

    /**
     * Validates that getById returns the item when it exists.
     * Scenario: Item with requested ID exists in repository.
     * Expected: Optional containing the item DTO.
     */
    @Test
    void testGetById_whenItemExists_shouldReturnDTO() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        Optional<InventoryItemDTO> result = inventoryItemService.getById("item-1");

        // Verify optional is present and contains expected item
        assertTrue(result.isPresent());
        assertEquals("SSD", result.get().getName());
    }

    /**
     * Validates that getById returns empty Optional when item not found.
     * Scenario: Item with requested ID does not exist.
     * Expected: Empty Optional (safe null handling).
     */
    @Test
    void testGetById_whenItemDoesNotExist_shouldReturnEmptyOptional() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        when(inventoryItemRepository.findById("item-999")).thenReturn(Optional.empty());

        Optional<InventoryItemDTO> result = inventoryItemService.getById("item-999");

        // Verify optional is empty
        assertFalse(result.isPresent());
    }
}
