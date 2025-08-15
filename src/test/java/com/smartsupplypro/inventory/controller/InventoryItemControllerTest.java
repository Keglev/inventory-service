package com.smartsupplypro.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.InventoryItemService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.endsWith;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * MVC slice tests for {@link InventoryItemController}.
 *
 * Scope: HTTP contract only (routing, security, status codes, headers, minimal JSON).
 * Business rules and side-effects are covered in service/integration tests.
 */
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean InventoryItemService inventoryItemService;

    /* -------------------- helpers -------------------- */

    private InventoryItemDTO sample(String id) {
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setId(id);
        dto.setName("Monitor");
        dto.setQuantity(10);
        dto.setPrice(new BigDecimal("199.99"));
        dto.setSupplierId("sup-1");
        return dto;
    }

    private InventoryItemDTO withoutId() {
        InventoryItemDTO dto = sample(null);
        dto.setId(null);
        return dto;
    }

    private InventoryItemDTO invalid() {
        // Intentionally invalid to trigger @Valid -> 400 before service runs
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setName(""); // NotBlank
        dto.setQuantity(-1); // PositiveOrZero
        dto.setPrice(new BigDecimal("-1.00")); // Decimal min
        return dto;
    }

    /* -------------------- create (POST -> save) -------------------- */

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

    @Test
    @DisplayName("POST /api/inventory -> 401 when unauthenticated")
    void create_unauthenticated_401() throws Exception {
        mockMvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(withoutId())))
            .andExpect(status().isUnauthorized());
    }

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


    /* ============================================================
     * ===============  MIGRATION PARKING LOT  =====================
     * ============================================================
     * Paste any of your EXISTING business-rule-heavy controller tests
     * below, but keep them commented. Each block is tagged with a
     * suggested destination. When you move them, delete the block.
     */

    // ============================================================
    // MOVE → InventoryItemServiceImplTest (business rules)
    // ============================================================

/*
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("[MOVE to Service] Duplicate name on save -> 409 (DuplicateResourceException)")
    void save_duplicateName_conflict() {}

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("[MOVE to Service] Supplier doesn’t exist -> 422")
    void save_supplierNotFound_unprocessable() {}

    @Test
    @WithMockUser(roles = "USER")
    @DisplayName("[MOVE to Service] Negative resulting stock on adjust -> 422")
    void adjustQuantity_negativeResultingStock_unprocessable() {}
*/

    // ============================================================
    // MOVE → InventoryItemServiceImplTest (side-effects)
    // ============================================================

/*
    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("[MOVE to Service] Delete writes one negative stock history entry before removal")
    void delete_writesStockHistoryOnce() {}
*/

    // ============================================================
    // MOVE → InventoryItemIntegrationTest (@SpringBootTest)
    // ============================================================

/*
    @Test
    @DisplayName("[MOVE to Integration] Create→Update→Delete happy path with H2/Testcontainers")
    void happyPath_endToEnd() {}
*/
}
