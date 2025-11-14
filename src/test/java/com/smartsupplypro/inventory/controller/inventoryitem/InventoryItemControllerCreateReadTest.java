package com.smartsupplypro.inventory.controller.inventoryitem;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.InventoryItemController;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * CREATE and READ operation tests for InventoryItemController.
 * 
 * Validates HTTP contract, security, and JSON serialization for:
 * - POST /api/inventory (create)
 * - GET /api/inventory (list all)
 * - GET /api/inventory/{id} (get by ID)
 * - GET /api/inventory/search (paginated search)
 * 
 * @see InventoryItemController
 * @see InventoryItemControllerUpdateDeleteTest
 * @see InventoryItemControllerPatchTest
 */
@SuppressWarnings("unused")
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerCreateReadTest {

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
     */
    private InventoryItemDTO invalid() {
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
}
