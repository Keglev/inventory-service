package com.smartsupplypro.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.InventoryServiceApplication;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.InventoryItemService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;


import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = InventoryItemController.class)
@ImportAutoConfiguration
@ContextConfiguration(classes = InventoryServiceApplication.class)
@ActiveProfiles("test")
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
public class InventoryItemControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private InventoryItemService inventoryItemService;

    @Autowired
    private ObjectMapper objectMapper;

    private InventoryItemDTO sampleItem;

    @BeforeEach
    void setup() {
        sampleItem = InventoryItemDTO.builder()
                .id("item-1")
                .name("Monitor")
                .quantity(10)
                .price(new BigDecimal("299.99"))
                .supplierId("supplier-1")
                .createdBy("admin")
                .build();
    }

    @Test
    @WithMockUser(roles = {"USER", "ADMIN"})
    void testGetById_shouldReturnItem() throws Exception {
        when(inventoryItemService.getById("item-1")).thenReturn(Optional.of(sampleItem));

        mockMvc.perform(get("/api/inventory/item-1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Monitor"));
    }

    @Test
    void testDeleteInventoryItem_withAdmin_shouldSucceed() throws Exception {
        doNothing().when(inventoryItemService).delete(eq("item-1"), eq(StockChangeReason.SCRAPPED));

        mockMvc.perform(delete("/api/inventory/item-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .param("reason", "SCRAPPED"))
                .andExpect(status().isNoContent());
        }

    @Test
    @WithMockUser(roles = {"USER", "ADMIN"})
    void testCreate_shouldReturnCreatedItem() throws Exception {
        when(inventoryItemService.save(any())).thenReturn(sampleItem);

        mockMvc.perform(post("/api/inventory")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleItem)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Monitor"));
    }

    @Test
    @WithMockUser(roles = {"USER", "ADMIN"})
    void testGetAll_shouldReturnList() throws Exception {
        when(inventoryItemService.getAll()).thenReturn(List.of(sampleItem));

        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Monitor"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testUpdate_shouldReturnUpdatedItem() throws Exception {
        when(inventoryItemService.update(eq("item-1"), any())).thenReturn(Optional.of(sampleItem));

        mockMvc.perform(put("/api/inventory/item-1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleItem)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Monitor"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testDelete_shouldReturnNoContent() throws Exception {
        doNothing().when(inventoryItemService).delete(eq("item-1"), eq(StockChangeReason.SCRAPPED));

        mockMvc.perform(delete("/api/inventory/item-1")
                        .with(csrf())
                        .param("reason", "SCRAPPED"))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testDelete_withMissingReason_shouldReturnBadRequest() throws Exception {
        mockMvc.perform(delete("/api/inventory/item-1")
                .with(csrf()))
                .andExpect(status().isBadRequest());
   }

    @Test
    @WithMockUser(roles = {"ADMIN", "USER"})
    void testSearchByName_shouldReturnMatchingItems() throws Exception {
        when(inventoryItemService.findByName("Monitor")).thenReturn(List.of(sampleItem));

        mockMvc.perform(get("/api/inventory/search")
                        .param("name", "Monitor"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Monitor"));
    }

    @Test
    @WithMockUser(roles = {"ADMIN", "USER"})
    void testGetById_whenNotFound_shouldReturn404() throws Exception {
        when(inventoryItemService.getById("item-404")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/inventory/item-404"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testUpdate_whenNotFound_shouldReturn404() throws Exception {
        when(inventoryItemService.update(eq("item-404"), any())).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/inventory/item-404")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleItem)))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = {"ADMIN", "USER"})
    void testGetAll_whenEmpty_shouldReturnEmptyList() throws Exception {
        when(inventoryItemService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @WithMockUser(roles = {"ADMIN", "USER"})
    void testSearchByName_whenNoMatches_shouldReturnEmptyList() throws Exception {
        when(inventoryItemService.findByName("NonExistingName")).thenReturn(List.of());

        mockMvc.perform(get("/api/inventory/search")
                        .param("name", "NonExistingName"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // -------------- Bad Request Tests ------------------

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testCreate_withInvalidInput_shouldReturnBadRequest() throws Exception {
        // Create invalid item (missing name)
        InventoryItemDTO invalidItem = InventoryItemDTO.builder()
                .id("item-2")
                .quantity(5)
                .price(new BigDecimal("199.99"))
                .supplierId("supplier-2")
                .createdBy("admin")
                .build();

        mockMvc.perform(post("/api/inventory")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidItem)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testUpdate_withInvalidInput_shouldReturnBadRequest() throws Exception {
        // Create invalid update payload (e.g., negative quantity)
        InventoryItemDTO invalidUpdate = InventoryItemDTO.builder()
                .id("item-1")
                .name("Monitor")
                .quantity(-5) //  invalid quantity
                .price(new BigDecimal("299.99"))
                .supplierId("supplier-1")
                .createdBy("admin")
                .build();

        mockMvc.perform(put("/api/inventory/item-1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidUpdate)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testCreate_withZeroPrice_shouldReturnBadRequest() throws Exception {
        // Create an item with price = 0
        InventoryItemDTO invalidPriceItem = InventoryItemDTO.builder()
                .id("item-3")
                .name("Keyboard")
                .quantity(10)
                .price(BigDecimal.ZERO) //  Invalid price: 0
                .supplierId("supplier-3")
                .createdBy("admin")
                .build();

        mockMvc.perform(post("/api/inventory")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidPriceItem)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"ADMIN", "USER"})
    void testCreate_whenDuplicateName_shouldReturnConflict() throws Exception {
        when(inventoryItemService.save(any()))
                .thenThrow(new IllegalArgumentException("An inventory item with this name already exists."));

         mockMvc.perform(post("/api/inventory")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleItem)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("An inventory item with this name already exists."));
   }

    @Test
    @WithMockUser(roles = {"ADMIN"})
    void testUpdate_whenDuplicateName_shouldReturnConflict() throws Exception {
        when(inventoryItemService.update(eq("item-1"), any()))
                .thenThrow(new IllegalArgumentException("An inventory item with this name already exists."));

        mockMvc.perform(put("/api/inventory/item-1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sampleItem)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("An inventory item with this name already exists."));
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void testDeleteInventoryItem_withUser_shouldFailForbidden() throws Exception {
        mockMvc.perform(delete("/api/inventory/item-1")
                        .with(csrf())
                        .param("reason", "SCRAPPED"))
                .andExpect(status().isForbidden());
    }
    @Test
    void testDeleteInventoryItem_withoutAuth_shouldFailUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/inventory/item-1")
                        .with(csrf())
                        .param("reason", "SCRAPPED"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testCreateInventoryItem_withoutAuth_shouldFailUnauthorized() throws Exception {
        mockMvc.perform(post("/api/inventory")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleItem)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void testUpdateInventoryItem_withUserChangingName_shouldFailForbidden() throws Exception {

        // Incoming DTO with a modified name
        InventoryItemDTO incoming = InventoryItemDTO.builder()
                .id("item-1")
                .name("New Monitor") // This should trigger the security validator
                .quantity(10)
                .price(new BigDecimal("299.99"))
                .supplierId("supplier-1")
                .createdBy("user1")
                .build();

        when(inventoryItemService.update(eq("item-1"), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Users are only allowed to change quantity or price."));

        mockMvc.perform(put("/api/inventory/item-1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(incoming)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void testUpdateInventoryItem_withUserChangingQuantity_shouldSucceed() throws Exception {
        InventoryItemDTO updatedDto = InventoryItemDTO.builder()
                .id("item-1")
                .name("Monitor") // unchanged
                .quantity(15)    // allowed change
                .price(new BigDecimal("299.99"))
                .supplierId("supplier-1")
                .createdBy("user1")
                .build();

         when(inventoryItemService.update(eq("item-1"), any()))
                .thenReturn(Optional.of(updatedDto));

        mockMvc.perform(put("/api/inventory/item-1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(15));
   }

    @Test
    @WithMockUser(roles = {"USER"})
    void testCreate_withInvalidInput_asUser_shouldReturnBadRequest() throws Exception {
        InventoryItemDTO invalidItem = InventoryItemDTO.builder()
                .id("item-2")
                .quantity(5)
                .price(new BigDecimal("199.99"))
                .supplierId("supplier-2")
                .createdBy("user")
                .build();

        mockMvc.perform(post("/api/inventory")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidItem)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void testCreate_withZeroPrice_asUser_shouldReturnBadRequest() throws Exception {
        InventoryItemDTO invalidItem = InventoryItemDTO.builder()
                .id("item-4")
                .name("Mouse")
                .quantity(5)
                .price(BigDecimal.ZERO)
                .supplierId("supplier-3")
                .createdBy("user")
                .build();

        mockMvc.perform(post("/api/inventory")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidItem)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void testUpdate_withInvalidInput_asUser_shouldReturnBadRequest() throws Exception {
        InventoryItemDTO invalidUpdate = InventoryItemDTO.builder()
                .id("item-1")
                .name("Monitor")
                .quantity(-5)
                .price(new BigDecimal("299.99"))
                .supplierId("supplier-1")
                .createdBy("user")
                .build();

        mockMvc.perform(put("/api/inventory/item-1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidUpdate)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"USER"})
    void testUpdate_whenDuplicateName_asUser_shouldReturnConflict() throws Exception {
        when(inventoryItemService.update(eq("item-1"), any()))
                .thenThrow(new IllegalArgumentException("An inventory item with this name already exists."));

        mockMvc.perform(put("/api/inventory/item-1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleItem)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("An inventory item with this name already exists."));
    }

}

