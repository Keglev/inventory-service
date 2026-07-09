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
import org.junit.jupiter.api.Nested;
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
        void should_populate_created_by_from_security_context_when_field_is_blank() {
            authenticateAs("admin@example.com");
            InventoryItemDTO dto = dto("SSD", 5, "10.00", "sup-1", "   ");
            dto.setSku("SKU-HLP-1");
            when(supplierRepository.existsById("sup-1")).thenReturn(true);
            when(repository.findByNameIgnoreCase("SSD")).thenReturn(Collections.emptyList());

            helper.validateForCreation(dto);

            assertEquals("admin@example.com", dto.getCreatedBy());
        }

        @Test
        void should_throw_when_supplier_does_not_exist() {
            authenticateAs("admin");
            InventoryItemDTO dto = dto("SSD", 5, "10.00", "missing-supplier", null);
            dto.setSku("SKU-HLP-2");
            when(supplierRepository.existsById("missing-supplier")).thenReturn(false);
            when(repository.findByNameIgnoreCase(anyString())).thenReturn(Collections.emptyList());

            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
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
            assertEquals(10, entity.getMinimumQuantity());
        }

        @Test
        void should_preserve_existing_id_created_at_and_minimum_quantity_and_fall_back_to_system_when_unauthenticated() {
            SecurityContextHolder.clearContext();
            LocalDateTime createdAt = LocalDateTime.of(2026, 1, 1, 0, 0);
            InventoryItem entity = entity("item-123", "Widget", 1, 20, "1.00", "sup-1", createdAt);
            entity.setSku("SKU-HLP-4");

            helper.populateServerFields(entity);

            assertEquals("item-123", entity.getId());
            assertEquals("system",   entity.getCreatedBy());
            assertEquals(createdAt,  entity.getCreatedAt());
            assertEquals(20,         entity.getMinimumQuantity());
        }
    }

    /**
     * Tests for {@code validateUniquenessOnUpdate()}.
     */
    @Nested
    class ValidateUniquenessOnUpdate {

        @Test
        void should_skip_repository_query_when_name_and_price_are_unchanged() {
            InventoryItem existing = existingItem("item-1", "Widget", "10.00");
            existing.setSku("SKU-HLP-5");
            InventoryItemDTO dto = new InventoryItemDTO();
            dto.setName("widget"); dto.setPrice(new BigDecimal("10.00")); dto.setSku("SKU-HLP-5");

            helper.validateUniquenessOnUpdate("item-1", existing, dto);

            verify(repository, never()).findByNameIgnoreCase(anyString());
        }

        @Test
        void should_throw_duplicate_exception_when_another_item_with_same_name_and_price_exists() {
            InventoryItem existing = existingItem("item-1", "Widget", "10.00");
            existing.setSku("SKU-HLP-6");
            InventoryItemDTO dto = new InventoryItemDTO();
            dto.setName("NewWidget"); dto.setPrice(new BigDecimal("10.00")); dto.setSku("SKU-HLP-6");

            InventoryItem other = existingItem("item-2", "NewWidget", "10.00");
            other.setSku("SKU-HLP-7");
            when(repository.findByNameIgnoreCase("NewWidget")).thenReturn(List.of(other));

            DuplicateResourceException ex = assertThrows(DuplicateResourceException.class,
                    () -> helper.validateUniquenessOnUpdate("item-1", existing, dto));
            assertEquals("Another inventory item with this name and price already exists.", ex.getMessage());
            verify(repository).findByNameIgnoreCase("NewWidget");
        }

        @Test
        void should_check_name_price_uniqueness_when_only_price_changed() {
            InventoryItem existing = existingItem("item-1", "Widget", "10.00");
            existing.setSku("SKU-1");
            InventoryItemDTO dto = new InventoryItemDTO();
            dto.setName("Widget"); dto.setPrice(new BigDecimal("20.00")); dto.setSku("SKU-1");
            when(repository.findByNameIgnoreCase("Widget")).thenReturn(List.of());

            helper.validateUniquenessOnUpdate("item-1", existing, dto);

            verify(repository).findByNameIgnoreCase("Widget");
            verify(repository, never()).findBySkuIgnoreCase(anyString());
        }

        @Test
        void should_check_sku_uniqueness_when_sku_changed() {
            InventoryItem existing = existingItem("item-1", "Widget", "10.00");
            existing.setSku("SKU-OLD");
            InventoryItemDTO dto = new InventoryItemDTO();
            dto.setName("Widget"); dto.setPrice(new BigDecimal("10.00")); dto.setSku("SKU-NEW");
            when(repository.findBySkuIgnoreCase("SKU-NEW")).thenReturn(List.of());

            helper.validateUniquenessOnUpdate("item-1", existing, dto);

            verify(repository).findBySkuIgnoreCase("SKU-NEW");
            verify(repository, never()).findByNameIgnoreCase(anyString());
        }

        @Test
        void should_check_sku_uniqueness_when_existing_sku_is_null() {
            InventoryItem existing = existingItem("item-1", "Widget", "10.00");
            InventoryItemDTO dto = new InventoryItemDTO();
            dto.setName("Widget"); dto.setPrice(new BigDecimal("10.00")); dto.setSku("SKU-NEW");
            when(repository.findBySkuIgnoreCase("SKU-NEW")).thenReturn(List.of());

            helper.validateUniquenessOnUpdate("item-1", existing, dto);

            verify(repository).findBySkuIgnoreCase("SKU-NEW");
        }
    }

    /**
     * Tests for {@code validateExists()}, {@code validateForDeletion()}, and {@code validateForUpdate()}.
     */
    @Nested
    class ValidationGating {

        @Test
        void should_throw_when_item_not_found_by_id() {
            when(repository.findById("missing")).thenReturn(Optional.empty());
            IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                    () -> helper.validateExists("missing"));
            assertEquals("Item not found", ex.getMessage());
        }

        @Test
        void should_throw_illegal_state_when_item_quantity_is_not_zero_on_deletion() {
            InventoryItem item = new InventoryItem();
            item.setId("item-1"); item.setQuantity(1); item.setSku("SKU-HLP-8");
            when(repository.findById("item-1")).thenReturn(Optional.of(item));
            assertNotNull(assertThrows(IllegalStateException.class,
                    () -> helper.validateForDeletion("item-1")).getMessage());
        }

        @Test
        void should_return_existing_item_when_update_passes_all_validation() {
            authenticateAs("admin");
            InventoryItem existing = existingItem("item-1", "Widget", "10.00");
            existing.setSupplierId("sup-1"); existing.setSku("SKU-HLP-9");

            InventoryItemDTO dto = new InventoryItemDTO();
            dto.setName("Widget"); dto.setQuantity(5); dto.setMinimumQuantity(1);
            dto.setPrice(new BigDecimal("10.00")); dto.setSupplierId("sup-1");
            dto.setCreatedBy("admin"); dto.setSku("SKU-HLP-9");

            when(supplierRepository.existsById("sup-1")).thenReturn(true);
            when(repository.findById("item-1")).thenReturn(Optional.of(existing));

            assertEquals("item-1", helper.validateForUpdate("item-1", dto).getId());
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
