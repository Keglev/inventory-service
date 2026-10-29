package com.smartsupplypro.inventory.controller.inventoryitem;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.InventoryItemController;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * Tests {@link InventoryItemController} DELETE endpoint using {@link MockMvc},
 * covering RBAC, HTTP contract, and security enforcement.
 */
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerUpdateDeleteTest {

    @Autowired MockMvc mockMvc;

    @MockitoBean InventoryItemService inventoryItemService;

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
