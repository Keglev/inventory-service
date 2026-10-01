package com.smartsupplypro.inventory.security;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.OAuth2Config;
import com.smartsupplypro.inventory.config.SecurityAuthorizationHelper;
import com.smartsupplypro.inventory.config.SecurityConfig;
import com.smartsupplypro.inventory.config.SecurityEntryPointHelper;
import com.smartsupplypro.inventory.config.SecurityFilterHelper;
import com.smartsupplypro.inventory.config.SecuritySpelBridgeConfig;
import com.smartsupplypro.inventory.controller.InventoryItemController;
import com.smartsupplypro.inventory.controller.SupplierController;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.service.InventoryItemService;
import com.smartsupplypro.inventory.service.SupplierService;

/**
 * Proves through the production {@link SecurityConfig}, with demo read-only on, that the
 * catalogue reads admit an anonymous demo caller and that roles on writes come from the
 * controllers' {@code @PreAuthorize}: the URL layer only requires a sign-in.
 */
@WebMvcTest(controllers = { InventoryItemController.class, SupplierController.class })
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.demo-readonly=true",
    "app.frontend.base-url=https://frontend.test",
    "spring.main.banner-mode=off",
    "logging.level.root=WARN"
})
@Import({
    SecurityConfig.class,
    SecurityAuthorizationHelper.class,
    SecurityFilterHelper.class,
    SecurityEntryPointHelper.class,
    OAuth2Config.class,
    SecuritySpelBridgeConfig.class,
    SecurityTestBeans.class
})
class CatalogueAccessSecurityTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private InventoryItemService inventoryItemService;

    @MockitoBean
    private SupplierService supplierService;

    private static final String ITEM_JSON = """
        {"name":"Widget","sku":"W-1","quantity":5,"minimumQuantity":1,
         "price":2.50,"supplierId":"s-1","createdBy":"user"}
        """;

    @Test
    void should_let_an_anonymous_demo_caller_read_one_supplier() throws Exception {
        when(supplierService.findById(anyString())).thenReturn(Optional.of(new SupplierDTO()));

        mvc.perform(get("/api/suppliers/s-1").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    void should_let_an_anonymous_demo_caller_read_one_item() throws Exception {
        when(inventoryItemService.getById(anyString())).thenReturn(Optional.of(new InventoryItemDTO()));

        mvc.perform(get("/api/inventory/i-1").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void should_refuse_a_user_who_creates_an_item_because_the_method_rule_requires_admin() throws Exception {
        mvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(ITEM_JSON))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "user", roles = "USER")
    void should_refuse_a_user_who_creates_a_supplier_because_the_method_rule_requires_admin() throws Exception {
        mvc.perform(post("/api/suppliers").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Acme\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void should_refuse_an_anonymous_write_even_in_demo_mode() throws Exception {
        mvc.perform(post("/api/inventory").with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(ITEM_JSON)
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isUnauthorized());
    }
}
