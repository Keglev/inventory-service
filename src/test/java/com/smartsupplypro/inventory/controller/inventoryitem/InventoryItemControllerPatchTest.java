package com.smartsupplypro.inventory.controller.inventoryitem;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.InventoryItemController;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * PATCH and utility operation tests for InventoryItemController.
 * 
 * Validates HTTP contract for partial updates:
 * - PATCH /api/inventory/{id}/quantity (quantity adjustment)
 * - PATCH /api/inventory/{id}/price (price update)
 * - GET /api/inventory/count (utility endpoint)
 * 
 * @see InventoryItemController
 * @see InventoryItemControllerCreateReadTest
 * @see InventoryItemControllerUpdateDeleteTest
 */
@SuppressWarnings("unused")
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerPatchTest {

    @Autowired MockMvc mockMvc;

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

    /* ==================== PATCH Operations (Partial Updates) ==================== */

    /**
     * Tests quantity adjustment for USER role.
     * Given: USER role with quantity delta and reason
     * When: PATCH /api/inventory/{id}/quantity
     * Then: Returns 200 with updated item
     */
    @Test
    @WithMockUser(roles = "USER")
    void patch_quantity_user_ok() throws Exception {
        when(inventoryItemService.adjustQuantity(eq("i-1"), eq(5), eq(StockChangeReason.SOLD)))
            .thenReturn(sample("i-1"));

        mockMvc.perform(patch("/api/inventory/i-1/quantity").with(csrf())
                .param("delta", "5")
                .param("reason", StockChangeReason.SOLD.name()))
            .andExpect(status().isOk());
    }

    /**
     * Tests price update for USER role.
     * Given: USER role with new price value
     * When: PATCH /api/inventory/{id}/price
     * Then: Returns 200 with updated item
     */
    @Test
    @WithMockUser(roles = "USER")
    void patch_price_user_ok() throws Exception {
        when(inventoryItemService.updatePrice(eq("i-1"), eq(new BigDecimal("149.99"))))
            .thenReturn(sample("i-1"));

        mockMvc.perform(patch("/api/inventory/i-1/price").with(csrf())
            .param("price", "149.99"))
            .andExpect(status().isOk());
    }

    /* ==================== UTILITY Operations ==================== */

    /**
     * Tests inventory count endpoint for authenticated users.
     * Given: Any authenticated user (no specific role required)
     * When: GET /api/inventory/count
     * Then: Returns 200 with count
     */
    @WithMockUser
    @Test
    void inventoryCount_accessibleToAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/inventory/count"))
            .andExpect(status().isOk());
    }
}
