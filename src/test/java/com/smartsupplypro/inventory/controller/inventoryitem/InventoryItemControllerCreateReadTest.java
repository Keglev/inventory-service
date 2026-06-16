package com.smartsupplypro.inventory.controller.inventoryitem;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.endsWith;
import org.junit.jupiter.api.Nested;
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
 * Tests {@link InventoryItemController} POST create and GET read endpoints using {@link MockMvc},
 * covering HTTP contract, security, and JSON serialization.
 */
@SuppressWarnings("unused")
@WebMvcTest(controllers = InventoryItemController.class)
@Import({ GlobalExceptionHandler.class, TestSecurityConfig.class })
class InventoryItemControllerCreateReadTest {

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
        return dto;
    }

    private InventoryItemDTO withoutId() {
        InventoryItemDTO dto = sample(null);
        dto.setId(null);
        return dto;
    }

    private InventoryItemDTO invalid() {
        InventoryItemDTO dto = new InventoryItemDTO();
        dto.setName("");
        dto.setQuantity(-1);
        dto.setPrice(new BigDecimal("-1.00"));
        return dto;
    }

    /** POST /api/inventory create scenarios. */
    @Nested
    class CreateItem {

        @Test
        @WithMockUser(roles = "ADMIN")
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
        void create_unauthenticated_401() throws Exception {
            mockMvc.perform(post("/api/inventory").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(withoutId())))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser(roles = "USER")
        void create_user_forbidden_403() throws Exception {
            mockMvc.perform(post("/api/inventory").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(withoutId())))
                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void create_invalid_400() throws Exception {
            mockMvc.perform(post("/api/inventory").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(invalid())))
                .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void create_duplicate_409() throws Exception {
            when(inventoryItemService.save(any()))
                .thenThrow(new DuplicateResourceException("Item name already exists"));
            mockMvc.perform(post("/api/inventory").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(withoutId())))
                .andExpect(status().isConflict());
        }
    }

    /** GET read and count scenarios. */
    @Nested
    class ReadAndCountItems {

        @Test
        @WithMockUser(roles = "USER")
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
        void getAll_returnsList() throws Exception {
            when(inventoryItemService.getAll()).thenReturn(List.of(sample("i-1"), sample("i-2")));
            mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("i-1"))
                .andExpect(jsonPath("$[1].id").value("i-2"));
        }

        @Test
        @WithMockUser(roles = "USER")
        void getAll_returnsEmptyList() throws Exception {
            when(inventoryItemService.getAll()).thenReturn(List.of());
            mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
        }

        @Test
        @WithMockUser(roles = "USER")
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

        @Test
        @WithMockUser(roles = "USER")
        void inventoryCount_accessibleToAuthenticatedUser() throws Exception {
            when(inventoryItemService.countItems()).thenReturn(5L);
            mockMvc.perform(get("/api/inventory/count"))
                .andExpect(status().isOk());
        }
    }
}
