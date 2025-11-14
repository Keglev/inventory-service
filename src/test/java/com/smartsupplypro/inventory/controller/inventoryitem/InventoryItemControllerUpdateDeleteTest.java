package com.smartsupplypro.inventory.controller.inventoryitem;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
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
 * UPDATE and DELETE operation tests for InventoryItemController.
 * 
 * Validates HTTP contract, security, and RBAC for:
 * - PUT /api/inventory/{id} (full update)
 * - DELETE /api/inventory/{id} (deletion with audit reason)
 * 
 * @see InventoryItemController
 * @see InventoryItemControllerCreateReadTest
 * @see InventoryItemControllerPatchTest
 */
@SuppressWarnings("unused")
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerUpdateDeleteTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean InventoryItemService inventoryItemService;

    /* ==================== Test Data Factory Methods ==================== */

    /**
     * Creates sample InventoryItemDTO for testing.
     */
    private InventoryItemDTO sample(String id) {
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setId(id);
        dto.setName("Monitor");
        dto.setQuantity(10);
        dto.setPrice(new BigDecimal("199.99"));
        dto.setSupplierId("sup-1");
        return dto;
    }

    /* ==================== UPDATE Operations (PUT /api/inventory/{id}) ==================== */

    /**
     * Tests role-based field restrictions for inventory updates.
     * Given: USER role attempting forbidden field changes
     * When: PUT /api/inventory/{id}
     * Then: Returns 403 Forbidden
     */
    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("PUT /api/inventory/{id} -> 403 when user attempts forbidden field changes")
    void update_user_forbidden_field_change() throws Exception {
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

    /**
     * Tests full inventory update for admin users.
     * Given: ADMIN role and valid/invalid item IDs
     * When: PUT /api/inventory/{id}
     * Then: Returns 200 with updated item or 404 if not found
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("PUT /api/inventory/{id} -> 200 when found, 404 when missing")
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

    /* ==================== DELETE Operations (DELETE /api/inventory/{id}) ==================== */

    /**
     * Tests inventory deletion security for unauthenticated users.
     * Given: No authentication context
     * When: DELETE /api/inventory/{id}
     * Then: Returns 401 Unauthorized
     */
    @Test
    @DisplayName("DELETE /api/inventory/{id} -> 401 when unauthenticated")
    void delete_unauthenticated_401() throws Exception {
        mockMvc.perform(delete("/api/inventory/i-1").with(csrf())
                .param("reason", StockChangeReason.SCRAPPED.name()))
            .andExpect(status().isUnauthorized());
    }

    /**
     * Tests successful inventory deletion for admin users.
     * Given: ADMIN role with valid item ID and reason
     * When: DELETE /api/inventory/{id}?reason=SCRAPPED
     * Then: Returns 204 No Content
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/inventory/{id}?reason=SCRAPPED -> 204 (ADMIN)")
    void delete_admin_noContent() throws Exception {
        mockMvc.perform(delete("/api/inventory/i-1").with(csrf())
                .param("reason", StockChangeReason.SCRAPPED.name()))
            .andExpect(status().isNoContent());
    }

    /**
     * Tests USER role restriction for inventory deletion.
     * Given: USER role attempting to delete inventory
     * When: DELETE /api/inventory/{id}
     * Then: Returns 403 Forbidden
     */
    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("DELETE /api/inventory/{id} -> 403 (USER forbidden)")
    void delete_user_forbidden() throws Exception {
        mockMvc.perform(delete("/api/inventory/i-1").with(csrf())
                .param("reason", StockChangeReason.SCRAPPED.name()))
            .andExpect(status().isForbidden());
    }

    /**
     * Tests validation requirement for deletion reason parameter.
     * Given: ADMIN role but missing reason parameter
     * When: DELETE /api/inventory/{id} without reason
     * Then: Returns 400 Bad Request
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/inventory/{id} without reason -> 400")
    void delete_missing_reason_badRequest() throws Exception {
        mockMvc.perform(delete("/api/inventory/i-1").with(csrf()))
            .andExpect(status().isBadRequest());
    }
}
