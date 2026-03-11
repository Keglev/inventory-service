package com.smartsupplypro.inventory.service.inventoryitem;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InjectMocks;
import org.mockito.Mock;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

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
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;

/**
 * Shared fixture for {@link InventoryItemServiceImpl} save operation unit tests.
 *
 * <p><strong>Intent</strong>: keep happy-path and validation tests in separate files without
 * duplicating the relatively heavy OAuth2 + validation-helper setup.</p>
 */
@SuppressWarnings("unused")
abstract class InventoryItemServiceSaveTestBase {

    @InjectMocks
    protected InventoryItemServiceImpl inventoryItemService;

    @Mock
    protected InventoryItemRepository inventoryItemRepository;

    @Mock
    protected StockHistoryService stockHistoryService;

    @Mock
    protected SupplierRepository supplierRepository;

    @Mock
    protected com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper validationHelper;

    @Mock
    protected com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper auditHelper;

    protected InventoryItemDTO dto;
    protected InventoryItem entity;

    @BeforeEach
    void setUpBase() {
        // Build a valid default DTO for save tests.
        dto = new InventoryItemDTO();
        dto.setId("item-1");
        dto.setName("SSD");
        dto.setQuantity(50);
        dto.setPrice(new BigDecimal("120.00"));
        dto.setSupplierId("supplier-1");
        dto.setCreatedBy("admin");

        entity = InventoryItemMapper.toEntity(dto);

        // Default mocks: supplier exists and repo operations succeed.
        when(supplierRepository.existsById(anyString())).thenReturn(true);
        when(inventoryItemRepository.findById(anyString())).thenReturn(Optional.of(entity));
        when(inventoryItemRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        // Configure validation helper to simulate validation behavior without depending on its implementation.
        org.mockito.Mockito.doAnswer(invocation -> {
            InventoryItemDTO dtoArg = invocation.getArgument(0);

            // Populate createdBy from OAuth2 context if missing.
            if (dtoArg.getCreatedBy() == null || dtoArg.getCreatedBy().trim().isEmpty()) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof OAuth2User) {
                    OAuth2User oauth2User = (OAuth2User) auth.getPrincipal();
                    dtoArg.setCreatedBy((String) oauth2User.getAttribute("email"));
                }
            }

            // Validate base fields.
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
            if (!supplierRepository.existsById(dtoArg.getSupplierId())) {
                throw new IllegalArgumentException("Supplier does not exist");
            }

            return null;
        }).when(validationHelper).validateForCreation(any(InventoryItemDTO.class));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    protected void authenticateAs(String email, String... roles) {
        // Create OAuth2 attributes with email.
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
}
