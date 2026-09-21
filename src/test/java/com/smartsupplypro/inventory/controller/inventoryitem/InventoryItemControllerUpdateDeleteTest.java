package com.smartsupplypro.inventory.controller.inventoryitem;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
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

import tools.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.InventoryItemController;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
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
        void should_return_403_when_a_user_changes_a_restricted_field() throws Exception {
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
        void should_update_or_return_404_when_the_item_is_found_or_missing() throws Exception {
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
        void should_return_401_when_deleting_unauthenticated() throws Exception {
            mockMvc.perform(delete("/api/inventory/i-1").with(csrf()))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void should_return_204_when_an_admin_deletes() throws Exception {
            mockMvc.perform(delete("/api/inventory/i-1").with(csrf()))
                .andExpect(status().isNoContent());
        }

        @Test
        @WithMockUser(roles = "USER")
        void should_return_403_when_a_user_deletes() throws Exception {
            mockMvc.perform(delete("/api/inventory/i-1").with(csrf()))
                .andExpect(status().isForbidden());
        }
    }
}
