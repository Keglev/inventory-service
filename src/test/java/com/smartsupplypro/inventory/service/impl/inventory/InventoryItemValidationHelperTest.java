package com.smartsupplypro.inventory.service.impl.inventory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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
import com.smartsupplypro.inventory.exception.BusinessRuleViolationException;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;

/**
 * Unit tests for {@link InventoryItemValidationHelper} business logic and exception handling behavior.
 */
@ExtendWith(MockitoExtension.class)
class InventoryItemValidationHelperTest {

    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @InjectMocks private InventoryItemValidationHelper helper;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Tests for {@code validateForCreation()}.
     */
    @Nested
    class ValidateForCreation {

        @Test
        void should_accept_the_dto_when_created_by_is_blank() {
            authenticateAs("admin@example.com");
            InventoryItemDTO dto = dto("SSD", 5, "10.00", "sup-1", "   ");
            dto.setSku("SKU-HLP-1");
            when(supplierRepository.existsById("sup-1")).thenReturn(true);
            when(repository.findByNameIgnoreCase("SSD")).thenReturn(Collections.emptyList());

            // createdBy is server-owned; populateServerFields sets it on the entity
            assertDoesNotThrow(() -> helper.validateForCreation(dto));
        }

        @Test
        void should_throw_when_supplier_does_not_exist() {
            authenticateAs("admin");
            InventoryItemDTO dto = dto("SSD", 5, "10.00", "missing-supplier", null);
            dto.setSku("SKU-HLP-2");
            when(supplierRepository.existsById("missing-supplier")).thenReturn(false);
            when(repository.findByNameIgnoreCase(anyString())).thenReturn(Collections.emptyList());

            InvalidRequestException ex = assertThrows(InvalidRequestException.class,
                    () -> helper.validateForCreation(dto));
            assertEquals("Supplier does not exist", ex.getMessage());
        }
    }

    /**
     * Tests for {@code populateServerFields()}.
     */
    @Nested
    class PopulateServerFields {

        @Test
        void should_generate_id_set_created_by_and_default_minimum_quantity_when_missing() {
            authenticateAs("system-user");
            InventoryItem entity = entity(" ", "Widget", 1, 0, "1.00", "sup-1", null);
            entity.setSku("SKU-HLP-3");

            helper.populateServerFields(entity);

            assertNotNull(entity.getId());
            assertEquals("system-user", entity.getCreatedBy());
            assertNotNull(entity.getCreatedAt());
            // the constant, not the literal: the default has one source
            assertEquals(InventoryItem.DEFAULT_MINIMUM_QUANTITY, entity.getMinimumQuantity());
        }

        @Test
        void should_preserve_existing_id_and_minimum_quantity_and_fall_back_to_system_when_unauthenticated() {
            SecurityContextHolder.clearContext();
            InventoryItem entity = entity("item-123", "Widget", 1, 20, "1.00", "sup-1", null);
            entity.setSku("SKU-HLP-4");

            helper.populateServerFields(entity);

            assertEquals("item-123", entity.getId());
            assertEquals("system",   entity.getCreatedBy());
            assertEquals(20,         entity.getMinimumQuantity());
        }

        @Test
        void should_replace_a_client_created_at_with_the_server_time_when_populating() {
            authenticateAs("admin");
            LocalDateTime clientValue = LocalDateTime.of(2020, 1, 1, 0, 0);
            InventoryItem entity = entity(null, "Widget", 1, 20, "1.00", "sup-1", clientValue);
            entity.setSku("SKU-HLP-4B");
            LocalDateTime before = LocalDateTime.now();

            helper.populateServerFields(entity);

            assertFalse(entity.getCreatedAt().isBefore(before));
        }
    }

    /**
     * Tests for {@code validateExists()} and {@code validateForDeletion()}.
     */
    @Nested
    class ValidationGating {

        @Test
        void should_throw_when_item_not_found_by_id() {
            when(repository.findById("missing")).thenReturn(Optional.empty());
            NoSuchElementException ex = assertThrows(NoSuchElementException.class,
                    () -> helper.validateExists("missing"));
            assertEquals("Item not found", ex.getMessage());
        }

        @Test
        void should_throw_a_business_rule_violation_when_item_quantity_is_not_zero_on_deletion() {
            InventoryItem item = new InventoryItem();
            item.setId("item-1"); item.setQuantity(1); item.setSku("SKU-HLP-8");
            when(repository.findById("item-1")).thenReturn(Optional.of(item));
            assertNotNull(assertThrows(BusinessRuleViolationException.class,
                    () -> helper.validateForDeletion("item-1")).getMessage());
        }

    }

    private static InventoryItemDTO dto(String name, int qty, String price, String supplierId, String createdBy) {
        InventoryItemDTO d = new InventoryItemDTO();
        d.setName(name); d.setQuantity(qty);
        d.setPrice(new BigDecimal(price)); d.setSupplierId(supplierId);
        d.setCreatedBy(createdBy);
        return d;
    }

    private static InventoryItem entity(String id, String name, int qty, int minQty,
                                        String price, String supplierId, LocalDateTime createdAt) {
        InventoryItem e = new InventoryItem();
        e.setId(id); e.setName(name); e.setQuantity(qty); e.setMinimumQuantity(minQty);
        e.setPrice(new BigDecimal(price)); e.setSupplierId(supplierId); e.setCreatedAt(createdAt);
        return e;
    }

    private static InventoryItem existingItem(String id, String name, String price) {
        InventoryItem e = new InventoryItem();
        e.setId(id); e.setName(name); e.setPrice(new BigDecimal(price));
        return e;
    }

    private static void authenticateAs(String username) {
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        OAuth2User principal = new DefaultOAuth2User(authorities, Map.of("email", username), "email");
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new OAuth2AuthenticationToken(principal, authorities, "test"));
        SecurityContextHolder.setContext(context);
    }
}
