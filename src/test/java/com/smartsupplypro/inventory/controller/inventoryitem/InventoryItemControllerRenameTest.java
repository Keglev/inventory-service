package com.smartsupplypro.inventory.controller.inventoryitem;

import java.math.BigDecimal;

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
import com.smartsupplypro.inventory.controller.InventoryItemController;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * Rename operation tests for InventoryItemController.
 * 
 * Validates HTTP contract for item name changes:
 * - PATCH /api/inventory/{id}/name (rename item - admin only)
 * 
 * Tests authorization (admin-only), duplicate name detection, and error handling.
 * 
 * @see InventoryItemController
 * @see InventoryItemControllerPatchTest
 * @see InventoryItemControllerCreateReadTest
 */
@SuppressWarnings("unused")
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerRenameTest {

    @Autowired 
    MockMvc mockMvc;

    @MockitoBean 
    InventoryItemService inventoryItemService;

    /* ==================== Test Data Factory Methods ==================== */

    /**
     * Creates sample InventoryItemDTO for testing.
     * Represents a typical inventory item with standard values.
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

    // Creates a sample item with a specific name for testing rename operations.
    private InventoryItemDTO sampleWithName(String id, String name) {
        InventoryItemDTO dto = sample(id);
        dto.setName(name);
        return dto;
    }

    /* ==================== PATCH /api/inventory/{id}/name Operations ==================== */

    /**
     * Tests rename operation for ADMIN role.
     * 
     * Given: ADMIN role with new item name
     * When: PATCH /api/inventory/{id}/name?name={newName}
     * Then: Returns 200 OK with updated item
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    void rename_admin_ok() throws Exception {
        // Arrange: Mock service to return item with new name
        when(inventoryItemService.renameItem(eq("i-1"), eq("Laptop Monitor")))
            .thenReturn(sampleWithName("i-1", "Laptop Monitor"));

        // Act & Assert: Execute PATCH and verify 200 response
        mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                .param("name", "Laptop Monitor"))
            .andExpect(status().isOk());
    }

    /**
     * Tests rename operation forbidden for non-admin USER role.
     * 
     * Given: USER role (not ADMIN)
     * When: PATCH /api/inventory/{id}/name?name={newName}
     * Then: Returns 403 Forbidden
     */
    @Test
    @WithMockUser(roles = "USER")
    void rename_user_forbidden() throws Exception {
        // Act & Assert: USER should not be able to rename items
        mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                .param("name", "New Name"))
            .andExpect(status().isForbidden());
    }

    /**
     * Tests rename operation forbidden for unauthenticated users.
     * 
     * Given: No authentication
     * When: PATCH /api/inventory/{id}/name?name={newName}
     * Then: Returns 401 Unauthorized
     */
    @Test
    void rename_unauthenticated_401() throws Exception {
        // Act & Assert: Unauthenticated requests should be rejected
        mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                .param("name", "New Name"))
            .andExpect(status().isUnauthorized());
    }

    /**
     * Tests rename with item not found.
     * 
     * Given: ADMIN role with non-existent item ID
     * When: PATCH /api/inventory/{id}/name?name={newName}
     * Then: Returns 404 Not Found
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    void rename_notFound_returns404() throws Exception {
        // Arrange: Mock service to throw exception for missing item
        doThrow(new IllegalArgumentException("Item not found: i-999"))
            .when(inventoryItemService).renameItem(eq("i-999"), eq("New Name"));

        // Act & Assert: Non-existent item should return 404
        mockMvc.perform(patch("/api/inventory/i-999/name").with(csrf())
                .param("name", "New Name"))
            .andExpect(status().isNotFound());
    }

    /**
     * Tests rename with duplicate name for same supplier.
     * 
     * Given: ADMIN role with name that already exists for same supplier
     * When: PATCH /api/inventory/{id}/name?name={duplicateName}
     * Then: Returns 409 Conflict
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    void rename_duplicateName_returns409() throws Exception {
        // Arrange: Mock service to throw exception for duplicate name
        String duplicateName = "Existing Item Name";
        doThrow(new IllegalArgumentException(
            "An item with this name already exists for this supplier"))
            .when(inventoryItemService).renameItem(eq("i-1"), eq(duplicateName));

        // Act & Assert: Duplicate name should return 409 Conflict
        mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                .param("name", duplicateName))
            .andExpect(status().isConflict());
    }

    /**
     * Tests rename with empty/blank name.
     * 
     * Given: ADMIN role with empty name
     * When: PATCH /api/inventory/{id}/name?name=""
     * Then: Returns 400 Bad Request
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    void rename_emptyName_returns400() throws Exception {
        // Arrange: Mock service to throw exception for empty name
        doThrow(new IllegalArgumentException("Item name cannot be empty"))
            .when(inventoryItemService).renameItem(eq("i-1"), eq(""));

        // Act & Assert: Empty name should return 400 Bad Request
        mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                .param("name", ""))
            .andExpect(status().isBadRequest());
    }

    /**
     * Tests rename with whitespace-only name.
     * 
     * Given: ADMIN role with whitespace-only name
     * When: PATCH /api/inventory/{id}/name?name="   "
     * Then: Returns 400 Bad Request
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    void rename_whitespaceOnlyName_returns400() throws Exception {
        // Arrange: Mock service to throw exception for whitespace-only name
        doThrow(new IllegalArgumentException("Item name cannot be empty"))
            .when(inventoryItemService).renameItem(eq("i-1"), eq("   "));

        // Act & Assert: Whitespace-only name should return 400
        mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                .param("name", "   "))
            .andExpect(status().isBadRequest());
    }

    /**
     * Tests rename with special characters in name.
     * 
     * Given: ADMIN role with special characters in name
     * When: PATCH /api/inventory/{id}/name?name={specialCharName}
     * Then: Returns 200 OK (special characters are allowed)
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    void rename_specialCharacters_ok() throws Exception {
        // Arrange: Special characters should be allowed in names
        String specialName = "Monitor 24\" (Premium)";
        when(inventoryItemService.renameItem(eq("i-1"), eq(specialName)))
            .thenReturn(sampleWithName("i-1", specialName));

        // Act & Assert: Special characters should be accepted
        mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                .param("name", specialName))
            .andExpect(status().isOk());
    }

    /**
     * Tests rename case-insensitive duplicate detection.
     * 
     * Given: ADMIN role renaming to "monitor" when "Monitor" already exists
     * When: PATCH /api/inventory/{id}/name?name="monitor"
     * Then: Returns 409 Conflict (case-insensitive match)
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    void rename_caseInsensitiveDuplicate_returns409() throws Exception {
        // Arrange: Case-insensitive duplicate should be detected
        doThrow(new IllegalArgumentException(
            "An item with this name already exists for this supplier"))
            .when(inventoryItemService).renameItem(eq("i-1"), eq("monitor"));

        // Act & Assert: Case-insensitive match should return 409
        mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf())
                .param("name", "monitor"))
            .andExpect(status().isConflict());
    }

    /**
     * Tests rename with missing name parameter.
     * 
     * Given: ADMIN role without name parameter
     * When: PATCH /api/inventory/{id}/name (no name query param)
     * Then: Returns 400 Bad Request
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    void rename_missingNameParam_returns400() throws Exception {
        // Act & Assert: Missing name parameter should return 400
        mockMvc.perform(patch("/api/inventory/i-1/name").with(csrf()))
            .andExpect(status().isBadRequest());
    }
}
