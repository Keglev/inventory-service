package com.smartsupplypro.inventory.service.impl.inventory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;

/**
 * Unit tests for {@link InventoryItemValidationHelper}.
 *
 * <p><strong>Why this suite exists</strong>:</p>
 * <ul>
 *   <li>These helpers are often mocked in service tests; without direct tests they may stay at 0% coverage.</li>
 *   <li>They encapsulate server-side population rules and security-context behavior that must remain stable.</li>
 * </ul>
 *
 * <p><strong>Scope</strong> (unit level):</p>
 * <ul>
 *   <li>Security-context fallback and createdBy population</li>
 *   <li>Supplier existence enforcement</li>
 *   <li>Server-side field population defaults (ID, createdAt, minimumQuantity)</li>
 *   <li>Uniqueness-on-update behavior when name/price change</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class InventoryItemValidationHelperTest {

    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;

    @InjectMocks private InventoryItemValidationHelper helper;

    @AfterEach
    @SuppressWarnings("unused")
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validateForCreation_populatesCreatedByFromSecurityContext_whenMissing() {
        // GIVEN
        authenticateAs("admin@example.com");

        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setName("SSD");
        dto.setQuantity(5);
        dto.setPrice(new BigDecimal("10.00"));
        dto.setSupplierId("sup-1");
        dto.setCreatedBy("   ");

        when(supplierRepository.existsById("sup-1")).thenReturn(true);
        when(repository.findByNameIgnoreCase("SSD")).thenReturn(Collections.emptyList());

        // WHEN
        helper.validateForCreation(dto);

        // THEN
        assertEquals("admin@example.com", dto.getCreatedBy());
    }

    @Test
    void validateForCreation_throws_whenSupplierDoesNotExist() {
        // GIVEN
        authenticateAs("admin");

        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setName("SSD");
        dto.setQuantity(5);
        dto.setPrice(new BigDecimal("10.00"));
        dto.setSupplierId("missing-supplier");

        when(supplierRepository.existsById("missing-supplier")).thenReturn(false);
        when(repository.findByNameIgnoreCase(anyString())).thenReturn(Collections.emptyList());

        // WHEN/THEN
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> helper.validateForCreation(dto));
        assertEquals("Supplier does not exist", ex.getMessage());
    }

    @Test
    void populateServerFields_generatesId_setsCreatedBy_setsCreatedAt_andDefaultsMinimumQuantity() {
        // GIVEN
        authenticateAs("system-user");

        InventoryItem entity = new InventoryItem();
        entity.setId(" ");
        entity.setName("Widget");
        entity.setQuantity(1);
        entity.setMinimumQuantity(0);
        entity.setPrice(new BigDecimal("1.00"));
        entity.setSupplierId("sup-1");
        entity.setCreatedAt(null);

        // WHEN
        helper.populateServerFields(entity);

        // THEN
        assertNotNull(entity.getId());
        assertEquals("system-user", entity.getCreatedBy());
        assertNotNull(entity.getCreatedAt());
        assertEquals(10, entity.getMinimumQuantity());
    }

    @Test
    void populateServerFields_preservesExistingIdCreatedAtAndMinimumQuantity_andFallsBackToSystem_whenUnauthenticated() {
        // GIVEN
        SecurityContextHolder.clearContext();

        LocalDateTime createdAt = LocalDateTime.of(2026, 1, 1, 0, 0);

        InventoryItem entity = new InventoryItem();
        entity.setId("item-123");
        entity.setName("Widget");
        entity.setQuantity(1);
        entity.setMinimumQuantity(20);
        entity.setPrice(new BigDecimal("1.00"));
        entity.setSupplierId("sup-1");
        entity.setCreatedAt(createdAt);

        // WHEN
        helper.populateServerFields(entity);

        // THEN
        assertEquals("item-123", entity.getId());
        assertEquals("system", entity.getCreatedBy());
        assertEquals(createdAt, entity.getCreatedAt());
        assertEquals(20, entity.getMinimumQuantity());
    }

    @Test
    void validateUniquenessOnUpdate_doesNothing_whenNameAndPriceUnchanged() {
        // GIVEN
        InventoryItem existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setPrice(new BigDecimal("10.00"));

        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setName("widget"); // case-insensitive same
        dto.setPrice(new BigDecimal("10.00"));

        // WHEN
        helper.validateUniquenessOnUpdate("item-1", existing, dto);

        // THEN
        // validateInventoryItemNotExists(...) is static; we assert no repository query was needed.
        verify(repository, never()).findByNameIgnoreCase(anyString());
    }

    @Test
    void validateUniquenessOnUpdate_throwsDuplicateResource_whenNameChangedAndAnotherItemWithSameNameAndPriceExists() {
        // GIVEN
        InventoryItem existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setPrice(new BigDecimal("10.00"));

        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setName("NewWidget");
        dto.setPrice(new BigDecimal("10.00"));

        InventoryItem other = new InventoryItem();
        other.setId("item-2");
        other.setName("NewWidget");
        other.setPrice(new BigDecimal("10.00"));

        when(repository.findByNameIgnoreCase("NewWidget")).thenReturn(List.of(other));

        // WHEN/THEN
        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
            () -> helper.validateUniquenessOnUpdate("item-1", existing, dto));

        assertEquals("Another inventory item with this name and price already exists.", ex.getMessage());

        verify(repository).findByNameIgnoreCase("NewWidget");
    }

    @Test
    void validateExists_throws_whenItemMissing() {
        // GIVEN
        when(repository.findById("missing")).thenReturn(Optional.empty());

        // WHEN/THEN
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> helper.validateExists("missing"));
        assertEquals("Item not found", ex.getMessage());
    }

    @Test
    void validateForDeletion_throwsIllegalState_whenQuantityNotZero() {
        // GIVEN
        InventoryItem item = new InventoryItem();
        item.setId("item-1");
        item.setQuantity(1);
        when(repository.findById("item-1")).thenReturn(Optional.of(item));

        // WHEN/THEN
        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> helper.validateForDeletion("item-1"));
        // Message text is owned by InventoryItemValidator; assert only type to avoid brittle coupling.
        assertNotNull(ex.getMessage());
    }

    @Test
    void validateForUpdate_returnsExistingItem_whenValid() {
        // GIVEN
        authenticateAs("admin");

        InventoryItem existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setPrice(new BigDecimal("10.00"));
        existing.setSupplierId("sup-1");

        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setName("Widget");
        dto.setQuantity(5);
        dto.setMinimumQuantity(1);
        dto.setPrice(new BigDecimal("10.00"));
        dto.setSupplierId("sup-1");
        dto.setCreatedBy("admin");

        when(supplierRepository.existsById("sup-1")).thenReturn(true);
        when(repository.findById("item-1")).thenReturn(Optional.of(existing));

        // WHEN
        InventoryItem returned = helper.validateForUpdate("item-1", dto);

        // THEN
        assertEquals("item-1", returned.getId());
    }

    private static void authenticateAs(String username) {
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        Map<String, Object> attributes = Map.of("email", username);
        OAuth2User principal = new DefaultOAuth2User(authorities, attributes, "email");

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new OAuth2AuthenticationToken(principal, authorities, "test"));
        SecurityContextHolder.setContext(context);
    }
}
