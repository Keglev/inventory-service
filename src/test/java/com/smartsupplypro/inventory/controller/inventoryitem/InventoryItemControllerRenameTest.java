package com.smartsupplypro.inventory.controller.inventoryitem;

import java.math.BigDecimal;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.InventoryItemPatchController;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.exception.BusinessExceptionHandler;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * Tests {@link InventoryItemPatchController} PATCH /api/inventory/{id}/name endpoint covering
 * authorization, validation, and business rule scenarios using {@link MockMvc}.
 */
@WebMvcTest(controllers = InventoryItemPatchController.class)
@Import({ GlobalExceptionHandler.class, BusinessExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerRenameTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    InventoryItemService inventoryItemService;

    private InventoryItemDTO sample(String id) {
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setId(id);
        dto.setName("Monitor");
        dto.setQuantity(10);
        dto.setPrice(new BigDecimal("199.99"));
        dto.setSupplierId("sup-1");
        return dto;
    }

    private InventoryItemDTO sampleWithName(String id, String name) {
        InventoryItemDTO dto = sample(id);
        dto.setName(name);
        return dto;
    }

    /** Rename succeeds for authorized ADMIN requests. */
    @Nested
    class WhenAuthorizedAdmin {

        @Test
        @WithMockUser(roles = "ADMIN")
        void rename_admin_ok() throws Exception {
            when(inventoryItemService.renameItem(eq("i-1"), eq("Laptop Monitor")))
                .thenReturn(sampleWithName("i-1", "Laptop Monitor"));

            mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                    .param("name", "Laptop Monitor"))
                .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void rename_specialCharacters_ok() throws Exception {
            String specialName = "Monitor 24\" (Premium)";
            when(inventoryItemService.renameItem(eq("i-1"), eq(specialName)))
                .thenReturn(sampleWithName("i-1", specialName));

            mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                    .param("name", specialName))
                .andExpect(status().isOk());
        }
    }

    /** Rename rejected for insufficient authorization. */
    @Nested
    class WhenUnauthorized {

        @Test
        @WithMockUser(roles = "USER")
        void rename_user_forbidden() throws Exception {
            mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                    .param("name", "New Name"))
                .andExpect(status().isForbidden());
        }

        @Test
        void rename_unauthenticated_401() throws Exception {
            mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                    .param("name", "New Name"))
                .andExpect(status().isUnauthorized());
        }
    }

    /** Rename rejected for invalid name input. */
    @Nested
    class WhenNameInvalid {

        @Test
        @WithMockUser(roles = "ADMIN")
        void rename_emptyName_returns400() throws Exception {
            doThrow(new IllegalArgumentException("Item name cannot be empty"))
                .when(inventoryItemService).renameItem(eq("i-1"), eq(""));

            mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                    .param("name", ""))
                .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void rename_whitespaceOnlyName_returns400() throws Exception {
            doThrow(new IllegalArgumentException("Item name cannot be empty"))
                .when(inventoryItemService).renameItem(eq("i-1"), eq("   "));

            mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                    .param("name", "   "))
                .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void rename_missingNameParam_returns400() throws Exception {
            mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf()))
                .andExpect(status().isBadRequest());
        }
    }

    /** Rename rejected for duplicate name constraint. */
    @Nested
    class WhenDuplicate {

        @Test
        @WithMockUser(roles = "ADMIN")
        void rename_duplicateName_returns409() throws Exception {
            String duplicateName = "Existing Item Name";
            doThrow(new DuplicateResourceException(
                "An item with this name already exists for this supplier"))
                .when(inventoryItemService).renameItem(eq("i-1"), eq(duplicateName));

            mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                    .param("name", duplicateName))
                .andExpect(status().isConflict());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void rename_caseInsensitiveDuplicate_returns409() throws Exception {
            doThrow(new DuplicateResourceException(
                "An item with this name already exists for this supplier"))
                .when(inventoryItemService).renameItem(eq("i-1"), eq("monitor"));

            mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                    .param("name", "monitor"))
                .andExpect(status().isConflict());
        }
    }

    /** Resource not found scenario. */
    @Nested
    class WhenNotFound {

        @Test
        @WithMockUser(roles = "ADMIN")
        void rename_notFound_returns404() throws Exception {
            doThrow(new IllegalArgumentException("Item not found: i-999"))
                .when(inventoryItemService).renameItem(eq("i-999"), eq("New Name"));

            mockMvc.perform(patch("/api/inventory/i-999/name").with(csrf())
                    .param("name", "New Name"))
                .andExpect(status().isNotFound());
        }
    }
}
