package com.smartsupplypro.inventory.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.endsWith;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * MVC tests for InventoryItemController - HTTP contract and security validation.
 * 
 * // ENTERPRISE: Web layer testing only, service logic tested in InventoryItemServiceTest
 * // SECURITY: Role-based access (ADMIN/USER), CSRF protection for state changes
 * // SCOPE: Request/response validation, status codes, JSON serialization
 * 
 * @see InventoryItemController
 * @see InventoryItemService
 */
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean InventoryItemService inventoryItemService;

    /* ==================== Test Data Factory Methods ==================== */

    /**
     * Creates sample InventoryItemDTO for testing.
     * 
     * // ENTERPRISE: Centralized test data creation with realistic business values
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

    /**
     * Creates InventoryItemDTO for POST operations (no ID).
     */
    private InventoryItemDTO withoutId() {
        InventoryItemDTO dto = sample(null);
        dto.setId(null);
        return dto;
    }

    /**
     * Creates intentionally invalid DTO for validation testing.
     * 
     * // ENTERPRISE: Triggers @Valid before service layer for 400 validation
     */
    private InventoryItemDTO invalid() {
        // Intentionally invalid to trigger @Valid -> 400 before service runs
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setName(""); // NotBlank
        dto.setQuantity(-1); // PositiveOrZero
        dto.setPrice(new BigDecimal("-1.00")); // Decimal min
        return dto;
    }

    /* ==================== CREATE Operations (POST /api/inventory) ==================== */

    /**
     * Tests inventory item creation with admin role.
     * Given: Valid item data and ADMIN role
     * When: POST /api/inventory
     * Then: Returns 201 with created item and location header
     * 
     * // ENTERPRISE: Validates Location header format per REST standards
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/inventory -> 201 + Location (ADMIN)")
    void create_returns201AndLocation() throws Exception {
        InventoryItemDTO request = withoutId();
        InventoryItemDTO created = sample("i-1");
        when(inventoryItemService.save(any())).thenReturn(created);

        mockMvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", endsWith("/api/inventory/i-1")))
            .andExpect(jsonPath("$.id").value("i-1"))
            .andExpect(jsonPath("$.name").value("Monitor"));
    }

    /**
     * Tests inventory creation rejection for unauthenticated users.
     * Given: No authentication context
     * When: POST /api/inventory  
     * Then: Returns 401 Unauthorized
     * 
     * // ENTERPRISE: Security policy - all inventory endpoints require authentication
     */
    @Test
    @DisplayName("POST /api/inventory -> 401 when unauthenticated")
    void create_unauthenticated_401() throws Exception {
        mockMvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(withoutId())))
            .andExpect(status().isUnauthorized());
    }

    /**
     * Tests role-based authorization - USER cannot create inventory.
     * Given: USER role authentication  
     * When: POST /api/inventory
     * Then: Returns 403 Forbidden
     * 
     * // ENTERPRISE: RBAC enforcement - only ADMIN can create/modify inventory
     */
    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("POST /api/inventory -> 403 (USER forbidden)")
    void create_user_forbidden_403() throws Exception {
        mockMvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(withoutId())))
            .andExpect(status().isForbidden());
    }

    /**
     * Tests input validation failure handling.
     * Given: ADMIN role with invalid DTO (empty name, negative values)
     * When: POST /api/inventory
     * Then: Returns 400 Bad Request
     * 
     * // ENTERPRISE: @Valid annotation triggers validation before service layer
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/inventory -> 400 when bean validation fails")
    void create_invalid_400() throws Exception {
        mockMvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalid())))
            .andExpect(status().isBadRequest());
    }

    /**
     * Tests duplicate resource exception handling.
     * Given: ADMIN role attempting to create duplicate item
     * When: POST /api/inventory with existing name
     * Then: Returns 409 Conflict
     * 
     * // ENTERPRISE: GlobalExceptionHandler converts DuplicateResourceException to 409
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/inventory -> 409 when duplicate (handler wiring)")
    void create_duplicate_409() throws Exception {
        when(inventoryItemService.save(any()))
            .thenThrow(new DuplicateResourceException("Item name already exists"));
        mockMvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(withoutId())))
            .andExpect(status().isConflict());
    }

    /* ==================== READ Operations (GET /api/inventory) ==================== */

    /**
     * Tests item retrieval by ID - both found and not found scenarios.
     * Given: USER role (read access allowed)
     * When: GET /api/inventory/{id}
     * Then: Returns 200 with item or 404 if not found
     * 
     * // ENTERPRISE: Standard REST contract for resource retrieval
     */
    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("GET /api/inventory/{id} -> 200 or 404")
    void getById_foundOrNotFound() throws Exception {
        when(inventoryItemService.getById("i-1")).thenReturn(Optional.of(sample("i-1")));
        when(inventoryItemService.getById("missing")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/inventory/i-1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value("i-1"));

        mockMvc.perform(get("/api/inventory/missing"))
            .andExpect(status().isNotFound());
    }

    /**
     * Tests inventory list retrieval with populated data.
     * Given: USER role and existing inventory items
     * When: GET /api/inventory
     * Then: Returns 200 with item array
     */
    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("GET /api/inventory -> 200 with list")
    void getAll_returnsList() throws Exception {
        when(inventoryItemService.getAll()).thenReturn(List.of(sample("i-1"), sample("i-2")));
        mockMvc.perform(get("/api/inventory"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("i-1"))
            .andExpect(jsonPath("$[1].id").value("i-2"));
    }

    /**
     * Tests inventory list retrieval with no data.
     * Given: USER role and empty inventory
     * When: GET /api/inventory
     * Then: Returns 200 with empty array
     */
    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("GET /api/inventory -> 200 with empty list")
    void getAll_returnsEmptyList() throws Exception {
        when(inventoryItemService.getAll()).thenReturn(List.of());
        mockMvc.perform(get("/api/inventory"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }

    /**
     * Tests search endpoint with pagination and sorting.
     * Given: USER role and search parameters
     * When: GET /api/inventory/search with pageable params
     * Then: Returns 200 with paginated results
     * 
     * // ENTERPRISE: Validates Spring Data pagination integration with REST layer
     */
    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("GET /api/inventory/search -> pageable & sort passed through")
    void search_pageableAndSort() throws Exception {
        when(inventoryItemService.findByNameSortedByPrice(eq("mon"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(sample("i-2"))));

        mockMvc.perform(get("/api/inventory/search")
                .param("name", "mon")
                .param("page", "1")
                .param("size", "5")
                .param("sort", "price,desc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value("i-2"));
    }

    /* ==================== UPDATE Operations (PUT /api/inventory/{id}) ==================== */

    /**
     * Tests role-based field restrictions for inventory updates.
     * Given: USER role attempting forbidden field changes
     * When: PUT /api/inventory/{id}
     * Then: Returns 403 Forbidden
     * 
     * // ENTERPRISE: Business rule - USERs can only modify quantity/price, not structural data
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
     * 
     * // ENTERPRISE: Standard REST update contract with Optional unwrapping
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
     * 
     * // ENTERPRISE: Deletion requires authentication and audit trail (reason parameter)
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
     * 
     * // ENTERPRISE: Only ADMIN users can delete inventory items
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
     * 
     * // ENTERPRISE: Audit compliance requires reason for all deletions
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/inventory/{id} without reason -> 400")
    void delete_missing_reason_badRequest() throws Exception {
        mockMvc.perform(delete("/api/inventory/i-1").with(csrf()))
            .andExpect(status().isBadRequest());
    }

    /* ==================== PATCH Operations (Partial Updates) ==================== */

    /**
     * Tests quantity adjustment for USER role.
     * Given: USER role with quantity delta and reason
     * When: PATCH /api/inventory/{id}/quantity
     * Then: Returns 200 with updated item
     * 
     * // ENTERPRISE: Users allowed to adjust quantity with audit trail (reason required)
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
     * 
     * // ENTERPRISE: Price updates allowed for USERs (business requirement)
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
     * 
     * // ENTERPRISE: Public read operation - any authenticated user can view count
     */
    @WithMockUser // signed-in user, no role
    @Test
    void inventoryCount_accessibleToAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/inventory/count"))
            .andExpect(status().isOk());
    }
}
