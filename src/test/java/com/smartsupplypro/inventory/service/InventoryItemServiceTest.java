package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;

import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.http.HttpStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import org.mockito.*;

import java.util.Optional;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Collection;
import java.util.Arrays;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit test class for {@link InventoryItemServiceImpl}. Verifies business rules, security integration,
 * validation logic, and side effects such as stock history tracking.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@ActiveProfiles("test")
public class InventoryItemServiceTest {

    @InjectMocks
    private InventoryItemServiceImpl inventoryItemService;

    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @Mock
    private StockHistoryService stockHistoryService;

    @Mock
    private SupplierRepository supplierRepository;

    private InventoryItemDTO dto;
    private InventoryItem entity;

    /**
     * Sets up a valid DTO and mock repository behavior before each test.
     */
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

    /**
     * Clears the SecurityContext after each test to avoid role leakage.
     */
    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Simulates OAuth2 user authentication with specified roles and email.
     * @param email the authenticated user's email
     * @param roles one or more roles (e.g. "ROLE_ADMIN")
     */
    private void mockOAuth2Authentication(String email, String... roles) {
        Map<String, Object> attributes = Map.of("email", email);

        Collection<GrantedAuthority> authorities = Arrays.stream(roles)
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());

        OAuth2User oauth2User = new DefaultOAuth2User(authorities, attributes, "email");

        Authentication auth = new TestingAuthenticationToken(oauth2User, null, authorities);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    // ========== SAVE TESTS ==========

    /**
     * Verifies that saving a valid InventoryItemDTO results in proper persistence
     * and triggers an INITIAL_STOCK log in stock history.
     */
    @Test
    void testSave_callsStockHistoryServiceWithInitialStock() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        InventoryItemDTO result = inventoryItemService.save(dto);

        assertNotNull(result);
        verify(inventoryItemRepository).save(any(InventoryItem.class));
        verify(stockHistoryService).logStockChange(
                eq("item-1"), eq(50), eq(StockChangeReason.INITIAL_STOCK), eq("admin")
        );
    }

    /**
     * Ensures zero quantity is allowed and still triggers history logging.
     */
    @Test
    void testSave_withZeroQuantity_shouldSucceed() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        dto.setQuantity(0);

        InventoryItemDTO result = inventoryItemService.save(dto);

        assertNotNull(result);
        verify(inventoryItemRepository).save(any(InventoryItem.class));
        verify(stockHistoryService).logStockChange("item-1", 0, StockChangeReason.INITIAL_STOCK, "admin");
    }

    /**
     * Throws IllegalArgumentException when an item with the same name already exists.
     */
    @Test
    void shouldThrowExceptionWhenInventoryItemAlreadyExists() {
        mockOAuth2Authentication("tester", "ROLE_ADMIN");

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
    // ========== VALIDATION TESTS FOR SAVE ==========

    /**
     * Verifies that saving an item with a null name throws an IllegalArgumentException
     * with an appropriate validation message.
     */
    @Test
    void testSave_withNullName_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setName(null);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));

        assertEquals("Product name cannot be null or empty", ex.getMessage());
    }

    /**
     * Ensures that a negative quantity is rejected and throws an IllegalArgumentException.
     */
    @Test
    void testSave_withNegativeQuantity_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setQuantity(-5);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));

        assertEquals("Quantity cannot be negative", ex.getMessage());
    }

    /**
     * Ensures that a negative price is rejected and throws an IllegalArgumentException.
     */
    @Test
    void testSave_withNegativePrice_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setPrice(new BigDecimal("-10.00"));

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));

        assertEquals("Price must be positive", ex.getMessage());
    }

    /**
     * Validates that a null supplier ID is rejected with a meaningful exception.
     */
    @Test
    void testSave_withNullSupplierId_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setSupplierId(null);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));

        assertEquals("Supplier ID must be provided", ex.getMessage());
    }

    /**
     * Ensures that the service rejects saving if the provided supplier ID does not exist in the system.
     */
    @Test
    void testValidateSupplierExists_withNonExistingSupplier_shouldThrow() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        when(supplierRepository.existsById("invalid-supplier")).thenReturn(false);
        InventoryItemDTO invalidDto = InventoryItemMapper.toDTO(entity);
        invalidDto.setSupplierId("invalid-supplier");

        Exception e = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(invalidDto));

        assertEquals("Supplier does not exist", e.getMessage());
    }

    /**
     * Validates that an empty or null `createdBy` field causes a validation failure.
     */
    @Test
    void testSave_withEmptyCreatedBy_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setCreatedBy(null);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));

        assertEquals("CreatedBy must be provided", ex.getMessage());
    }
    // ========== UPDATE TESTS ==========

    /**
     * Verifies that when an ADMIN user updates an item's quantity, the change is saved,
     * and a stock history log entry is created with the delta value.
     */
    @Test
    void testUpdate_withQuantityChange_asAdmin_shouldSucceed() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        InventoryItem existing = InventoryItemMapper.toEntity(dto);
        existing.setQuantity(30);
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(existing));

        dto.setQuantity(50); // +20 increase

        Optional<InventoryItemDTO> result = inventoryItemService.update("item-1", dto);

        assertTrue(result.isPresent());
        verify(stockHistoryService).logStockChange(eq("item-1"), eq(20), eq(StockChangeReason.MANUAL_UPDATE), eq("admin"));
    }

    /**
     * Verifies that a USER (non-admin) can still update the quantity field.
     * Quantity updates should succeed without permission errors.
     */
    @Test
    void testUpdate_withQuantityChange_asUser_shouldSucceed() {
        mockOAuth2Authentication("user", "ROLE_USER");

        InventoryItem existing = InventoryItemMapper.toEntity(dto);
        existing.setQuantity(30);
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(existing));

        dto.setQuantity(50); // change = +20

        Optional<InventoryItemDTO> result = inventoryItemService.update("item-1", dto);

        assertTrue(result.isPresent());
        verify(stockHistoryService).logStockChange(eq("item-1"), eq(20), eq(StockChangeReason.MANUAL_UPDATE), eq("admin"));
    }

    /**
     * Ensures that a USER attempting to change the item name is denied access with 403 Forbidden.
     * Only ADMINs are allowed to rename inventory items.
     */
    @Test
    void testUpdate_withNameChange_asUser_shouldThrow403() {
        mockOAuth2Authentication("user", "ROLE_USER");

        InventoryItem existing = InventoryItemMapper.toEntity(dto);
        existing.setName("Old SSD");
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(existing));

        dto.setName("New SSD");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                inventoryItemService.update("item-1", dto)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    /**
     * Ensures that if the quantity remains unchanged, the stock history logging service
     * is not invoked unnecessarily during an update operation.
     */
    @Test
    void testUpdate_withoutQuantityChange_doesNotCallStockHistoryService() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        InventoryItem existing = InventoryItemMapper.toEntity(dto);
        existing.setQuantity(50); // same as DTO
        when(inventoryItemRepository.findById("item-1")).thenReturn(Optional.of(existing));

        Optional<InventoryItemDTO> result = inventoryItemService.update("item-1", dto);

        assertTrue(result.isPresent());
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
    }

    /**
     * Tests the behavior when trying to update a non-existent inventory item.
     * The method should return an empty Optional and not interact with the stock history service.
     */
    @Test
    void testUpdate_whenItemNotFound_shouldReturnEmptyOptional() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        when(inventoryItemRepository.findById("invalid-id")).thenReturn(Optional.empty());

        Optional<InventoryItemDTO> result = inventoryItemService.update("invalid-id", dto);

        assertFalse(result.isPresent());
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
    }
    // ========== DELETE TESTS ==========

    /**
     * Verifies that a valid deletion with a supported reason (e.g., DESTROYED)
     * correctly logs a negative stock change and removes the item from the repository.
     */
    @Test
    void testDelete_withValidReason_shouldDeleteAndLog() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        inventoryItemService.delete("item-1", StockChangeReason.DESTROYED);

        verify(stockHistoryService).logStockChange("item-1", -50, StockChangeReason.DESTROYED, "admin");
        verify(inventoryItemRepository).deleteById("item-1");
    }

    /**
     * Ensures that using an invalid deletion reason (e.g., SOLD) raises an exception
     * and prevents both deletion and stock history logging.
     */
    @Test
    void testDelete_withInvalidReason_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            inventoryItemService.delete("item-1", StockChangeReason.SOLD) // invalid for delete
        );

        assertEquals("Invalid reason for deletion", ex.getMessage());
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
        verify(inventoryItemRepository, never()).deleteById(any());
    }

    /**
     * Verifies that attempting to delete an inventory item that does not exist
     * results in an appropriate exception and skips logging or deletion actions.
     */
    @Test
    void testDelete_nonExistingItem_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        when(inventoryItemRepository.findById("invalid-id")).thenReturn(Optional.empty());

        Exception ex = assertThrows(IllegalArgumentException.class, () ->
            inventoryItemService.delete("invalid-id", StockChangeReason.DESTROYED)
        );

        assertEquals("Item not found", ex.getMessage());
        verify(stockHistoryService, never()).logStockChange(any(), anyInt(), any(), any());
        verify(inventoryItemRepository, never()).deleteById(any());
    }
    // ========== GET BY ID TESTS ==========

    /**
     * Verifies that when a valid item ID is provided and the item exists,
     * the service correctly retrieves and maps the entity to a DTO.
     */
    @Test
    void testGetById_whenItemExists_shouldReturnDTO() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        Optional<InventoryItemDTO> result = inventoryItemService.getById("item-1");

        assertTrue(result.isPresent());
        assertEquals("SSD", result.get().getName());
    }

    /**
     * Ensures that when an invalid or unknown item ID is provided,
     * the service returns an empty Optional and does not throw.
     */
    @Test
    void testGetById_whenItemDoesNotExist_shouldReturnEmptyOptional() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        when(inventoryItemRepository.findById("item-999")).thenReturn(Optional.empty());

        Optional<InventoryItemDTO> result = inventoryItemService.getById("item-999");

        assertFalse(result.isPresent());
    }
}
/**
 * Verifies that the service correctly handles unauthorized access attempts
 * by returning an empty Optional when the user does not have permission.
 */

