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
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
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

import tools.jackson.databind.ObjectMapper;
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
        dto.setSku("SKU-CTL-1");
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
        dto.setSku("SKU-CTL-2");
        return dto;
    }

    /** POST /api/inventory create scenarios. */
    @Nested
    class CreateItem {

        @Test
        @WithMockUser(roles = "ADMIN")
        void should_return_201_and_a_location_when_an_item_is_created() throws Exception {
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
        void should_return_401_when_creating_unauthenticated() throws Exception {
            mockMvc.perform(post("/api/inventory").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(withoutId())))
                .andExpect(status().isUnauthorized());
        }

        @Test
        @WithMockUser(roles = "USER")
        void should_return_403_when_a_user_creates_an_item() throws Exception {
            mockMvc.perform(post("/api/inventory").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(withoutId())))
                .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void should_return_400_when_the_item_is_invalid() throws Exception {
            mockMvc.perform(post("/api/inventory").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(invalid())))
                .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void should_return_400_with_field_errors_when_the_sku_is_missing() throws Exception {
            InventoryItemDTO request = withoutId();
            request.setSku(null);

            mockMvc.perform(post("/api/inventory").with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.sku").value("SKU is mandatory"));
        }

        @Test
        @WithMockUser(roles = "ADMIN")
        void should_return_409_when_the_item_is_a_duplicate() throws Exception {
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
        void should_return_the_item_or_404_when_looking_up_by_id() throws Exception {
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
        void should_return_the_list_when_items_exist() throws Exception {
            when(inventoryItemService.getAll()).thenReturn(List.of(sample("i-1"), sample("i-2")));
            mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("i-1"))
                .andExpect(jsonPath("$[1].id").value("i-2"));
        }

        @Test
        @WithMockUser(roles = "USER")
        void should_return_an_empty_list_when_no_items_exist() throws Exception {
            when(inventoryItemService.getAll()).thenReturn(List.of());
            mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
        }

        @Test
        @WithMockUser(roles = "USER")
        void should_apply_paging_and_sort_when_searching() throws Exception {
            when(inventoryItemService.searchItems(eq("mon"), eq(null), eq(false), any(Pageable.class)))
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
        void should_search_when_every_parameter_including_name_is_omitted() throws Exception {
            when(inventoryItemService.searchItems(eq(""), eq(null), eq(false), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sample("i-3"))));

            mockMvc.perform(get("/api/inventory/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("i-3"));
        }

        @Test
        @WithMockUser(roles = "USER")
        void should_forward_the_supplier_id_and_below_minimum_flag_when_searching() throws Exception {
            when(inventoryItemService.searchItems(eq("bolt"), eq("sup-9"), eq(true), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sample("i-4"))));

            mockMvc.perform(get("/api/inventory/search")
                    .param("name", "bolt")
                    .param("supplierId", "sup-9")
                    .param("belowMinimumOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value("i-4"));
        }

        @Test
        @WithMockUser(roles = "USER")
        void should_return_the_count_when_the_user_is_authenticated() throws Exception {
            when(inventoryItemService.countItems()).thenReturn(5L);
            mockMvc.perform(get("/api/inventory/count"))
                .andExpect(status().isOk());
        }
    }
}
