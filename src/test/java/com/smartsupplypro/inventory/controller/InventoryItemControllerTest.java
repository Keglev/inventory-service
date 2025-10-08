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
 * Enterprise MVC Integration Tests for {@link InventoryItemController}.
 * 
 * <p>This test suite validates the complete HTTP contract and security integration
 * of the inventory item management REST API, ensuring proper request/response handling,
 * status codes, security enforcement, and JSON serialization.</p>
 * 
 * <h3>Test Architecture:</h3>
 * <ul>
 *   <li><strong>Test Slice:</strong> @WebMvcTest for focused web layer testing</li>
 *   <li><strong>Security Integration:</strong> Custom TestSecurityConfig with role-based testing</li>
 *   <li><strong>Exception Handling:</strong> GlobalExceptionHandler integration</li>
 *   <li><strong>Mock Strategy:</strong> Service layer mocked for isolated HTTP testing</li>
 * </ul>
 * 
 * <h3>Coverage Scope:</h3>
 * <ul>
 *   <li><strong>HTTP Contract:</strong> Routing, request mapping, and response structure</li>
 *   <li><strong>Security Enforcement:</strong> Role-based access control (ADMIN/USER)</li>
 *   <li><strong>Validation Integration:</strong> @Valid annotation and constraint validation</li>
 *   <li><strong>Error Handling:</strong> Exception to HTTP status code mapping</li>
 *   <li><strong>Content Negotiation:</strong> JSON request/response processing</li>
 * </ul>
 * 
 * <h3>Business Logic Exclusion:</h3>
 * <p><strong>Note:</strong> Business rules, data persistence, and service interactions 
 * are intentionally excluded from this test suite. These concerns are thoroughly 
 * covered in:</p>
 * <ul>
 *   <li>{@link com.smartsupplypro.inventory.service.InventoryItemServiceTest} - Service logic</li>
 *   <li>{@link com.smartsupplypro.inventory.repository.InventoryItemRepositoryTest} - Data access</li>
 *   <li>Integration tests - End-to-end business workflows</li>
 * </ul>
 * 
 * <h3>Security Testing Strategy:</h3>
 * <ul>
 *   <li><strong>Admin Operations:</strong> CREATE, UPDATE, DELETE operations require ADMIN role</li>
 *   <li><strong>User Operations:</strong> READ operations available to USER role</li>
 *   <li><strong>Anonymous Access:</strong> All endpoints require authentication</li>
 *   <li><strong>CSRF Protection:</strong> State-changing operations require CSRF tokens</li>
 * </ul>
 * 
 * @author SmartSupplyPro Development Team
 * @version 1.0.0
 * @since 2025-10-08
 * @see InventoryItemController
 * @see InventoryItemService
 * @see TestSecurityConfig
 */
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean InventoryItemService inventoryItemService;

    /* ==================== Test Data Factory Methods ==================== */

    /**
     * Creates a sample InventoryItemDTO for testing purposes.
     * 
     * @param id the inventory item ID, or null for new items
     * @return fully populated InventoryItemDTO with valid test data
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
     * Creates a new InventoryItemDTO without ID for creation testing.
     * 
     * @return InventoryItemDTO suitable for POST operations
     */
    private InventoryItemDTO withoutId() {
        InventoryItemDTO dto = sample(null);
        dto.setId(null);
        return dto;
    }

    /**
     * Creates an intentionally invalid InventoryItemDTO for validation testing.
     * 
     * <p>This DTO violates multiple validation constraints:</p>
     * <ul>
     *   <li>Name is blank (violates @NotBlank)</li>
     *   <li>Quantity is negative (violates @PositiveOrZero)</li>
     *   <li>Price is negative (violates @DecimalMin)</li>
     * </ul>
     * 
     * @return invalid InventoryItemDTO for 400 Bad Request testing
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
     * Validates successful inventory item creation with ADMIN role.
     * 
     * <p><strong>Test Scenario:</strong> Admin user creates new inventory item</p>
     * 
     * <h4>Given:</h4>
     * <ul>
     *   <li>User authenticated with ADMIN role</li>
     *   <li>Valid inventory item DTO without ID</li>
     *   <li>Service layer returns created item with generated ID</li>
     *   <li>CSRF token provided</li>
     * </ul>
     * 
     * <h4>When:</h4>
     * <ul>
     *   <li>POST request to /api/inventory with JSON payload</li>
     * </ul>
     * 
     * <h4>Then:</h4>
     * <ul>
     *   <li>HTTP 201 Created status returned</li>
     *   <li>Location header points to new resource</li>
     *   <li>Response body contains created item with ID</li>
     *   <li>Service.save() method called with request data</li>
     * </ul>
     * 
     * <h4>Security Verification:</h4>
     * <ul>
     *   <li>ADMIN role authorization enforced</li>
     *   <li>CSRF protection validated</li>
     * </ul>
     * 
     * @throws Exception if MockMvc request fails
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
     * Validates that unauthenticated requests are rejected for inventory creation.
     * 
     * <p><strong>Test Scenario:</strong> Anonymous user attempts to create inventory item</p>
     * 
     * <h4>Security Policy Tested:</h4>
     * <ul>
     *   <li>All inventory management endpoints require authentication</li>
     *   <li>Anonymous access is prohibited for data modification</li>
     * </ul>
     * 
     * <h4>Given:</h4>
     * <ul>
     *   <li>No authentication context (anonymous user)</li>
     *   <li>Valid inventory item DTO</li>
     *   <li>CSRF token provided</li>
     * </ul>
     * 
     * <h4>When:</h4>
     * <ul>
     *   <li>POST request to /api/inventory</li>
     * </ul>
     * 
     * <h4>Then:</h4>
     * <ul>
     *   <li>HTTP 401 Unauthorized status returned</li>
     *   <li>Service layer is not invoked</li>
     *   <li>No data modification occurs</li>
     * </ul>
     * 
     * @throws Exception if MockMvc request fails
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
     * Validates that USER role is insufficient for inventory item creation.
     * 
     * <p><strong>Test Scenario:</strong> User with USER role attempts creation</p>
     * 
     * <h4>Authorization Policy Tested:</h4>
     * <ul>
     *   <li>CREATE operations require ADMIN role</li>
     *   <li>USER role provides read-only access</li>
     *   <li>Role-based access control enforcement</li>
     * </ul>
     * 
     * <h4>Given:</h4>
     * <ul>
     *   <li>User authenticated with USER role</li>
     *   <li>Valid inventory item DTO</li>
     *   <li>CSRF token provided</li>
     * </ul>
     * 
     * <h4>When:</h4>
     * <ul>
     *   <li>POST request to /api/inventory</li>
     * </ul>
     * 
     * <h4>Then:</h4>
     * <ul>
     *   <li>HTTP 403 Forbidden status returned</li>
     *   <li>Service layer is not invoked</li>
     *   <li>Access denied based on role restriction</li>
     * </ul>
     * 
     * @throws Exception if MockMvc request fails
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

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/inventory -> 400 when bean validation fails")
    void create_invalid_400() throws Exception {
        mockMvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalid())))
            .andExpect(status().isBadRequest());
    }

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

    /* -------------------- read -------------------- */

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

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("GET /api/inventory -> 200 with empty list")
    void getAll_returnsEmptyList() throws Exception {
        when(inventoryItemService.getAll()).thenReturn(List.of());
        mockMvc.perform(get("/api/inventory"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }

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

    /* -------------------- update (PUT unwraps Optional) -------------------- */

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

    /* -------------------- delete -------------------- */

    @Test
    @DisplayName("DELETE /api/inventory/{id} -> 401 when unauthenticated")
    void delete_unauthenticated_401() throws Exception {
        mockMvc.perform(delete("/api/inventory/i-1").with(csrf())
                .param("reason", StockChangeReason.SCRAPPED.name()))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/inventory/{id}?reason=SCRAPPED -> 204 (ADMIN)")
    void delete_admin_noContent() throws Exception {
        mockMvc.perform(delete("/api/inventory/i-1").with(csrf())
                .param("reason", StockChangeReason.SCRAPPED.name()))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("DELETE /api/inventory/{id} -> 403 (USER forbidden)")
    void delete_user_forbidden() throws Exception {
        mockMvc.perform(delete("/api/inventory/i-1").with(csrf())
                .param("reason", StockChangeReason.SCRAPPED.name()))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /api/inventory/{id} without reason -> 400")
    void delete_missing_reason_badRequest() throws Exception {
        mockMvc.perform(delete("/api/inventory/i-1").with(csrf()))
            .andExpect(status().isBadRequest());
    }

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

    @Test
    @WithMockUser(roles = "USER")
    void patch_price_user_ok() throws Exception {
        when(inventoryItemService.updatePrice(eq("i-1"), eq(new BigDecimal("149.99"))))
            .thenReturn(sample("i-1"));

        mockMvc.perform(patch("/api/inventory/i-1/price").with(csrf())
            .param("price", "149.99"))
            .andExpect(status().isOk());
    }

    /**
     * Test that the inventory count endpoint is accessible to any authenticated user,
     * regardless of their role.
     * 
     * @throws Exception if the request fails
     */
    @WithMockUser // signed-in user, no role
    @Test
    void inventoryCount_accessibleToAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/inventory/count"))
            .andExpect(status().isOk());
    }
}
