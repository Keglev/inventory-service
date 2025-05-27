package com.smartsupplypro.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.service.SupplierService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.smartsupplypro.inventory.testconfig.SecurityTestConfig;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;


import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@WebMvcTest(SupplierController.class)
@ActiveProfiles("test")
@Import({SecurityTestConfig.class, GlobalExceptionHandler.class})
public class SupplierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SupplierService supplierService;

    @Autowired
    private ObjectMapper objectMapper;

    private SupplierDTO supplierTemplate;

    @BeforeEach
    void setUp() {
        supplierTemplate = SupplierDTO.builder()
                .id("supplier-1")
                .name("ABC Components")
                .contactName("Jane Doe")
                .email("contact@abc.com")
                .phone("123456789")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private SupplierDTO buildSupplierWithCreatedBy(String createdBy) {
        return SupplierDTO.builder()
                .id(supplierTemplate.getId())
                .name(supplierTemplate.getName())
                .contactName(supplierTemplate.getContactName())
                .email(supplierTemplate.getEmail())
                .phone(supplierTemplate.getPhone())
                .createdBy(createdBy)
                .createdAt(supplierTemplate.getCreatedAt())
                .build();
    }
// ========== Tests accessible for both USER and ADMIN ==========

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetAll_shouldReturnSupplierList(String role) throws Exception {
        when(supplierService.getAll()).thenReturn(List.of(buildSupplierWithCreatedBy(role)));

        mockMvc.perform(get("/api/suppliers")
                        .with(user("testuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("ABC Components"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetById_shouldReturnSupplier(String role) throws Exception {
        when(supplierService.getById("supplier-1")).thenReturn(buildSupplierWithCreatedBy(role));

        mockMvc.perform(get("/api/suppliers/supplier-1")
                        .with(user("testuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("contact@abc.com"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testSearchByName_shouldReturnMatchingSuppliers(String role) throws Exception {
        when(supplierService.findByName("ABC")).thenReturn(List.of(buildSupplierWithCreatedBy(role)));

        mockMvc.perform(get("/api/suppliers/search")
                        .with(user("testuser").roles(role))
                        .param("name", "ABC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("ABC Components"));
    }

    // ========== ADMIN-only operations ==========

    @Test
    void testCreate_asAdmin_shouldReturnCreatedSupplier() throws Exception {
        when(supplierService.save(any())).thenReturn(buildSupplierWithCreatedBy("admin"));

        mockMvc.perform(post("/api/suppliers")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildSupplierWithCreatedBy("admin"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contactName").value("Jane Doe"));
    }

    @Test
    void testCreate_asUser_shouldReturnForbidden() throws Exception {
        mockMvc.perform(post("/api/suppliers")
                        .with(csrf())
                        .with(user("regularuser").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildSupplierWithCreatedBy("user"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdate_asAdmin_shouldReturnUpdatedSupplier() throws Exception {
        when(supplierService.update(eq("supplier-1"), any())).thenReturn(Optional.of(buildSupplierWithCreatedBy("admin")));

        mockMvc.perform(put("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildSupplierWithCreatedBy("admin"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("ABC Components"));
    }

    @Test
    void testUpdate_asUser_shouldReturnForbidden() throws Exception {
        mockMvc.perform(put("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("regularuser").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildSupplierWithCreatedBy("user"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void testDelete_asAdmin_shouldReturnNoContent() throws Exception {
        doNothing().when(supplierService).delete("supplier-1");

        mockMvc.perform(delete("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN")))
                .andExpect(status().isNoContent());
    }

    @Test
    void testDelete_asUser_shouldReturnForbidden() throws Exception {
        mockMvc.perform(delete("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("regularuser").roles("USER")))
                .andExpect(status().isForbidden());
    }

   @Test
    void testCreate_withDuplicateName_shouldReturnConflict() throws Exception {
        SupplierDTO dto = buildSupplierWithCreatedBy("admin");

        when(supplierService.save(dto)).thenReturn(dto); // first call OK
        mockMvc.perform(post("/api/suppliers")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated());

        when(supplierService.save(dto)).thenThrow(new DuplicateResourceException("A Supplier with this name already exists."));
        mockMvc.perform(post("/api/suppliers")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("A Supplier with this name already exists."));
    }

    @Test
    void testUpdate_withDuplicateName_shouldReturnConflict() throws Exception {
        SupplierDTO dto = buildSupplierWithCreatedBy("admin");

        when(supplierService.update(eq("supplier-1"), any())).thenThrow(new DuplicateResourceException("A Supplier with this name already exists."));
        mockMvc.perform(put("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("A Supplier with this name already exists."));
    }

    @Test
    void testGetById_whenNotFound_shouldReturn404() throws Exception {
        when(supplierService.getById("nonexistent")).thenThrow(new NoSuchElementException("Supplier not found"));

        mockMvc.perform(get("/api/suppliers/nonexistent")
                        .with(user("adminuser").roles("ADMIN")))
                        .andExpect(status().isNotFound());
    }
    // TODO: Re-enable this test once CSRF protection is active again.
//
// Currently, CSRF is globally disabled in SecurityConfig:
//    http.csrf(csrf -> csrf.disable())
//
// This is intentional for local development and testing,
// and will be replaced when OAuth2 authentication is implemented.
//
// Once CSRF is enabled, this test should ensure that POST requests
// without a CSRF token are rejected with HTTP 403 Forbidden.
 // TODO: Re-enable this test once CSRF protection is active again.
    // @Test
    // void testCreate_withoutCsrf_shouldFail() throws Exception {
      //   SupplierDTO dto = buildSupplierWithCreatedBy("admin");
      //  mockMvc.perform(post("/api/suppliers")
      //                  .with(user("adminuser").roles("ADMIN"))
      //                  .contentType(MediaType.APPLICATION_JSON)
      //                  .content(objectMapper.writeValueAsString(dto)))
      //          .andExpect(status().isForbidden());
   // }

    @Test
    void testCreate_withMissingName_shouldReturnBadRequest() throws Exception {
        SupplierDTO invalid = SupplierDTO.builder()
                .contactName("Jane")
                .email("invalid@abc.com")
                .phone("000000000")
                .createdBy("admin")
                .build();

        mockMvc.perform(post("/api/suppliers")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testUpdate_withMissingName_shouldReturnBadRequest() throws Exception {
        SupplierDTO invalid = SupplierDTO.builder()
                .contactName("Jane")
                .email("update@abc.com")
                .phone("999999999")
                .createdBy("admin")
                .build();

        mockMvc.perform(put("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testDelete_whenSupplierHasItems_shouldReturnConflict() throws Exception {
        doThrow(new IllegalStateException("Cannot delete supplier with linked items"))
                .when(supplierService).delete("supplier-1");

        mockMvc.perform(delete("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Cannot delete supplier with linked items"));
    }
}
