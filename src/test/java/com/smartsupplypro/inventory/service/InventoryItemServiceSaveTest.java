package com.smartsupplypro.inventory.service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;

/**
 * Save operation tests for {@link InventoryItemServiceImpl}.
 *
 * <p><strong>Operation Coverage:</strong></p>
 * <ul>
 *   <li><b>save:</b> Persist new inventory items with full validation</li>
 * </ul>
 *
 * <p><strong>Validation Layers:</strong></p>
 * <ul>
 *   <li><b>Base validation:</b> Name, quantity, price non-null and valid ranges</li>
 *   <li><b>Supplier check:</b> Supplier ID must exist in repository</li>
 *   <li><b>Audit setup:</b> CreatedBy derived from OAuth2 context if not provided</li>
 *   <li><b>History logging:</b> Initial stock recorded via auditHelper</li>
 * </ul>
 *
 * <p><strong>Exception Mapping:</strong></p>
 * <ul>
 *   <li>Missing/blank name → {@link IllegalArgumentException}</li>
 *   <li>Negative quantity → {@link IllegalArgumentException}</li>
 *   <li>Non-positive price → {@link IllegalArgumentException}</li>
 *   <li>Missing/invalid supplier → {@link IllegalArgumentException}</li>
 * </ul>
 *
 * <p><strong>Design Notes:</strong></p>
 * <ul>
 *   <li>validationHelper is mocked to test validation integration without implementation.</li>
 *   <li>auditHelper is mocked to verify initial stock logging is called.</li>
 *   <li>OAuth2 context is mocked to simulate authenticated users.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class InventoryItemServiceSaveTest {

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

        // Default mocks: supplier exists and repo operations succeed
        when(supplierRepository.existsById(anyString())).thenReturn(true);
        when(inventoryItemRepository.findById(anyString())).thenReturn(Optional.of(entity));
        when(inventoryItemRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        
        // Configure validation helper to simulate actual validation logic
        org.mockito.Mockito.doAnswer(invocation -> {
            InventoryItemDTO dtoArg = invocation.getArgument(0);
            // Set createdBy from security context if missing
            if (dtoArg.getCreatedBy() == null || dtoArg.getCreatedBy().trim().isEmpty()) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof OAuth2User) {
                    OAuth2User oauth2User = (OAuth2User) auth.getPrincipal();
                    dtoArg.setCreatedBy((String) oauth2User.getAttribute("email"));
                }
            }
            // Validate base fields - throw exceptions for invalid data
            if (dtoArg.getName() == null || dtoArg.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Product name cannot be null or empty");
            }
            if (dtoArg.getQuantity() < 0) {
                throw new IllegalArgumentException("Quantity cannot be negative");
            }
            if (dtoArg.getPrice() == null || dtoArg.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Price must be positive or greater than zero");
            }
            if (dtoArg.getSupplierId() == null || dtoArg.getSupplierId().trim().isEmpty()) {
                throw new IllegalArgumentException("Supplier ID must be provided");
            }
            // Check supplier exists
            if (!supplierRepository.existsById(dtoArg.getSupplierId())) {
                throw new IllegalArgumentException("Supplier does not exist");
            }
            return null;
        }).when(validationHelper).validateForCreation(any(InventoryItemDTO.class));
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
     * Validates that valid inventory items are persisted and initial stock is logged.
     * Scenario: New item with all valid fields and OAuth2 authenticated user.
     * Expected: Item saved and auditHelper.logInitialStock called for audit trail.
     */
    @Test
    void testSave_callsStockHistoryServiceWithInitialStock() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");

        InventoryItemDTO result = inventoryItemService.save(dto);

        assertNotNull(result);
        verify(inventoryItemRepository).save(any(InventoryItem.class));
        // Verify audit helper is called (which internally calls stockHistoryService)
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }

    /**
     * Validates that items with zero quantity (no stock on hand) can be created.
     * Scenario: New item with quantity = 0.
     * Expected: Item saved with 0 quantity and audit log still created.
     */
    @Test
    void testSave_withZeroQuantity_shouldSucceed() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setQuantity(0);

        InventoryItemDTO result = inventoryItemService.save(dto);

        assertNotNull(result);
        // Verify audit helper is called (which internally calls stockHistoryService)
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }

    /**
     * Validates that null product name is rejected.
     * Scenario: Item name is null.
     * Expected: {@link IllegalArgumentException} with descriptive message.
     */
    @Test
    void testSave_withNullName_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setName(null);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Product name cannot be null or empty", ex.getMessage());
    }

    /**
     * Validates that negative quantities are rejected.
     * Scenario: Item quantity is negative (invalid state).
     * Expected: {@link IllegalArgumentException}.
     */
    @Test
    void testSave_withNegativeQuantity_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setQuantity(-5);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Quantity cannot be negative", ex.getMessage());
    }

    /**
     * Validates that non-positive prices are rejected.
     * Scenario: Item price is negative (invalid cost).
     * Expected: {@link IllegalArgumentException}.
     */
    @Test
    void testSave_withNegativePrice_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setPrice(new BigDecimal("-10.00"));

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Price must be positive or greater than zero", ex.getMessage());
    }

    /**
     * Validates that missing supplier ID is rejected.
     * Scenario: Supplier ID is null (no supplier linked).
     * Expected: {@link IllegalArgumentException}.
     */
    @Test
    void testSave_withNullSupplierId_shouldThrowException() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setSupplierId(null);

        Exception ex = assertThrows(IllegalArgumentException.class, () -> inventoryItemService.save(dto));
        assertEquals("Supplier ID must be provided", ex.getMessage());
    }

    /**
     * Validates that non-existent supplier is rejected.
     * Scenario: Supplier ID exists in request but supplier does not exist in repository.
     * Expected: {@link IllegalArgumentException}.
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
     * Validates that missing createdBy is derived from OAuth2 context.
     * Scenario: CreatedBy not provided in DTO; should be populated from authentication.
     * Expected: Item saved with email from OAuth2 principal as createdBy.
     */
    @Test
    void testSave_withEmptyCreatedBy_shouldSucceed() {
        mockOAuth2Authentication("admin", "ROLE_ADMIN");
        dto.setCreatedBy(null);

        InventoryItemDTO result = inventoryItemService.save(dto);
        assertNotNull(result);
        assertEquals("admin", result.getCreatedBy());
    }

    /**
     * Validates the happy path: new item with no duplicates is saved successfully.
     * Scenario: New unique item created with supplier that exists.
     * Expected: Item persisted and audit helper called.
     */
    @Test
    void shouldSaveItemSuccessfullyWhenNoDuplicateExists() {
        mockOAuth2Authentication("tester", "ROLE_ADMIN");

        // Mock: no existing items with this name
        when(inventoryItemRepository.findByNameIgnoreCase("Widget")).thenReturn(java.util.List.of());
        when(supplierRepository.existsById("some-supplier")).thenReturn(true);

        // Mock: repository returns saved entity with generated ID
        InventoryItem savedEntity = InventoryItem.builder()
                .id("new-id")
                .name("Widget")
                .price(BigDecimal.valueOf(10.0))
                .quantity(5)
                .minimumQuantity(1)
                .supplierId("some-supplier")
                .createdBy("tester")
                .build();

        when(inventoryItemRepository.save(any())).thenReturn(savedEntity);

        // Set up request DTO
        dto.setName("Widget");
        dto.setPrice(BigDecimal.valueOf(10.0));
        dto.setQuantity(5);
        dto.setSupplierId("some-supplier");
        dto.setCreatedBy("tester");

        InventoryItemDTO result = inventoryItemService.save(dto);

        // Verify result and audit call
        assertNotNull(result);
        assertEquals("Widget", result.getName());
        // Verify audit helper is called (which internally calls stockHistoryService)
        verify(auditHelper).logInitialStock(any(InventoryItem.class));
    }
}
