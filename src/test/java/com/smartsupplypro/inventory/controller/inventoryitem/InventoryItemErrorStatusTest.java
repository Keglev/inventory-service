package com.smartsupplypro.inventory.controller.inventoryitem;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.InventoryItemController;
import com.smartsupplypro.inventory.controller.InventoryItemPatchController;
import com.smartsupplypro.inventory.exception.BusinessExceptionHandler;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.service.impl.InventoryItemServiceImpl;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper;

/**
 * Proves the HTTP status of service-level failures through the real inventory service and
 * the exception handlers, with only the repositories mocked: invalid input answers 400 and
 * a missing item answers 404.
 */
@WebMvcTest(controllers = { InventoryItemController.class, InventoryItemPatchController.class })
@Import({
    GlobalExceptionHandler.class, BusinessExceptionHandler.class, TestSecurityConfig.class,
    InventoryItemServiceImpl.class, InventoryItemValidationHelper.class,
    InventoryItemAuditHelper.class, InventoryItemMapper.class
})
class InventoryItemErrorStatusTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    InventoryItemRepository inventoryItemRepository;

    @MockitoBean
    SupplierRepository supplierRepository;

    @MockitoBean
    StockHistoryService stockHistoryService;

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void should_return_400_when_a_new_item_names_a_supplier_that_does_not_exist() throws Exception {
        when(supplierRepository.existsById(anyString())).thenReturn(false);

        mockMvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Widget","sku":"W-1","quantity":5,"minimumQuantity":1,
                     "price":2.50,"supplierId":"no-such-supplier","createdBy":"admin"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Supplier does not exist"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void should_return_400_when_an_item_is_renamed_to_a_blank_name() throws Exception {
        mockMvc.perform(patch("/api/inventory/any-id/name").with(csrf()).param("name", "   "))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Item name cannot be empty"));
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void should_return_404_when_the_price_of_a_missing_item_is_changed() throws Exception {
        when(inventoryItemRepository.findById(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/inventory/missing/price").with(csrf()).param("price", "3.00"))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void should_return_404_when_a_missing_item_is_renamed() throws Exception {
        when(inventoryItemRepository.findById(anyString())).thenReturn(Optional.empty());

        mockMvc.perform(patch("/api/inventory/missing/name").with(csrf()).param("name", "New"))
            .andExpect(status().isNotFound());
    }
}
