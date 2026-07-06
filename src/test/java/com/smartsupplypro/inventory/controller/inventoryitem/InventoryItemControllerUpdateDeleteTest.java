package com.smartsupplypro.inventory.controller.inventoryitem;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.InventoryItemController;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * Tests {@link InventoryItemController} PUT update and DELETE endpoints using {@link MockMvc},
 * covering RBAC, HTTP contract, and security enforcement.
 */
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerUpdateDeleteTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean InventoryItemService inventoryItemService;

    private InventoryItemDTO sample(String id) {
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setId(id);
        dto.setName("Monitor");
        dto.setQuantity(10);
        dto.setPrice(new BigDecimal("199.99"));
        dto.setSupplierId("sup-1");
        dto.setSku("SKU-CTL-1");
        return dto;
    }

    /** PUT /api/inventory/{id} update scenarios. */
    @Nested
    class UpdateItem {

        @Test
        @WithMockUser(roles = "USER")
        void update_user_forbidden_fieldChange() throws Exception {
            when(inventoryItemService.update(eq("i-1"), any(InventoryItemDTO.class)))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Users are only allowed to change quantity or price."
                ));

            mockMvc.perform(put("/api/inventory/i-1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(sample("i-1"))))
                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void update_foundOrMissing() throws Exception {
            InventoryItemDTO updated = sample("i-1");
            when(inventoryItemService.update(eq("i-1"), any(InventoryItemDTO.class)))
                .thenReturn(Optional.of(updated));
            when(inventoryItemService.update(eq("missing"), any(InventoryItemDTO.class)))
                .thenReturn(Optional.empty());

            mockMvc.perform(put("/api/inventory/i-1").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("i-1"));

            mockMvc.perform(put("/api/inventory/missing").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isNotFound());
        }
    }

    /** DELETE /api/inventory/{id} deletion scenarios. */
    @Nested
    class DeleteItem {

        @Test
        void delete_unauthenticated_401() throws Exception {
            mockMvc.perform(delete("/api/inventory/i-1").with(csrf())
                    .param("reason", StockChangeReason.SCRAPPED.name()))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void delete_admin_noContent() throws Exception {
            mockMvc.perform(delete("/api/inventory/i-1").with(csrf())
                    .param("reason", StockChangeReason.SCRAPPED.name()))
                .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser(roles = "USER")
        void delete_user_forbidden() throws Exception {
            mockMvc.perform(delete("/api/inventory/i-1").with(csrf())
                    .param("reason", StockChangeReason.SCRAPPED.name()))
                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void delete_missingReason_badRequest() throws Exception {
            mockMvc.perform(delete("/api/inventory/i-1").with(csrf()))
                .andExpect(status().isBadRequest());
        }
    }
}
