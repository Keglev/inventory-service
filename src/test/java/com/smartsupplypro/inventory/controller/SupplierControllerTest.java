package com.smartsupplypro.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
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

/**
 * Integration-level tests for the {@link SupplierController}, focusing on both
 * shared (USER & ADMIN) and role-restricted (ADMIN-only) functionality.
 *
 * All test methods simulate HTTP requests using {@link MockMvc} and verify
 * expected status codes, JSON payloads, and access restrictions.
 *
 * Test cases are executed in a Spring WebMvcTest context with an in-memory profile ("test").
 */
@WebMvcTest(SupplierController.class)
@ActiveProfiles("test")
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
public class SupplierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SupplierService supplierService;

    @Autowired
    private ObjectMapper objectMapper;

    private SupplierDTO supplierTemplate;

    /**
     * Initializes a reusable SupplierDTO object before each test.
     */
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

    /**
     * Utility method to clone the template with a dynamic "createdBy" field.
     *
     * @param createdBy user ID creating the supplier
     * @return a new SupplierDTO object
     */
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

    /**
     * Test to ensure all users (USER, ADMIN) can fetch the list of suppliers.
     *
     * @param role either "USER" or "ADMIN"
     */
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

    /**
     * Test to verify that both USER and ADMIN roles can retrieve a supplier by ID.
     *
     * @param role authorized user role
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetById_shouldReturnSupplier(String role) throws Exception {
        when(supplierService.getById("supplier-1")).thenReturn(buildSupplierWithCreatedBy(role));

        mockMvc.perform(get("/api/suppliers/supplier-1")
                        .with(user("testuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("contact@abc.com"));
    }

    /**
     * Test to verify that users (USER or ADMIN) can search for suppliers by name.
     *
     * @param role authorized user role
     */
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
    /**
     * Test to ensure an ADMIN can successfully create a new supplier.
     * The response should include the correct contact name.
     */
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

    /**
     * Test to ensure a USER attempting to create a supplier receives 403 Forbidden.
     */
    @Test
    void testCreate_asUser_shouldReturnForbidden() throws Exception {
        mockMvc.perform(post("/api/suppliers")
                        .with(csrf())
                        .with(user("regularuser").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildSupplierWithCreatedBy("user"))))
                .andExpect(status().isForbidden());
    }

    /**
     * Test to ensure an ADMIN can successfully update an existing supplier.
     */
    @Test
    void testUpdate_asAdmin_shouldReturnUpdatedSupplier() throws Exception {
        when(supplierService.update(eq("supplier-1"), any()))
                .thenReturn(Optional.of(buildSupplierWithCreatedBy("admin")));

        mockMvc.perform(put("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildSupplierWithCreatedBy("admin"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("ABC Components"));
    }

    /**
     * Test to verify that USERs cannot update suppliers and receive 403 Forbidden.
     */
    @Test
    void testUpdate_asUser_shouldReturnForbidden() throws Exception {
        mockMvc.perform(put("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("regularuser").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildSupplierWithCreatedBy("user"))))
                .andExpect(status().isForbidden());
    }

    /**
     * Test to ensure ADMIN can delete an existing supplier.
     */
    @Test
    void testDelete_asAdmin_shouldReturnNoContent() throws Exception {
        doNothing().when(supplierService).delete("supplier-1");

        mockMvc.perform(delete("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN")))
                .andExpect(status().isNoContent());
    }

    /**
     * Test to verify that USERs cannot delete suppliers and receive 403 Forbidden.
     */
    @Test
    void testDelete_asUser_shouldReturnForbidden() throws Exception {
        mockMvc.perform(delete("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("regularuser").roles("USER")))
                .andExpect(status().isForbidden());
    }

    /**
     * Test to verify that creating a supplier with a duplicate name results in HTTP 409 Conflict.
     */
    @Test
    void testCreate_withDuplicateName_shouldReturnConflict() throws Exception {
        SupplierDTO dto = buildSupplierWithCreatedBy("admin");

        when(supplierService.save(dto)).thenReturn(dto); // First attempt is OK
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

    /**
     * Test to verify that updating a supplier with a duplicate name results in HTTP 409 Conflict.
     */
    @Test
    void testUpdate_withDuplicateName_shouldReturnConflict() throws Exception {
        SupplierDTO dto = buildSupplierWithCreatedBy("admin");

        when(supplierService.update(eq("supplier-1"), any()))
                .thenThrow(new DuplicateResourceException("A Supplier with this name already exists."));

        mockMvc.perform(put("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("A Supplier with this name already exists."));
    }

    /**
     * Test to ensure a 404 Not Found is returned when requesting a nonexistent supplier by ID.
     */
    @Test
    void testGetById_whenNotFound_shouldReturn404() throws Exception {
        when(supplierService.getById("nonexistent"))
                .thenThrow(new NoSuchElementException("Supplier not found"));

        mockMvc.perform(get("/api/suppliers/nonexistent")
                        .with(user("adminuser").roles("ADMIN")))
                .andExpect(status().isNotFound());
    }
    /**
     * Test to ensure POST requests without authentication return 401 Unauthorized.
     */
    @Test
    void testCreate_withoutAuth_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(post("/api/suppliers")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildSupplierWithCreatedBy("admin"))))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Test to ensure PUT requests without authentication return 401 Unauthorized.
     */
    @Test
    void testUpdate_withoutAuth_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(put("/api/suppliers/supplier-1")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildSupplierWithCreatedBy("admin"))))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Test to ensure DELETE requests without authentication return 401 Unauthorized.
     */
    @Test
    void testDelete_withoutAuth_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/suppliers/supplier-1")
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Test to verify that creating a supplier with missing required field 'name'
     * results in a 400 Bad Request response.
     */
    @Test
    void testCreate_withMissingName_shouldReturnBadRequest() throws Exception {
        SupplierDTO invalid = SupplierDTO.builder()
                .contactName("Jane")
                .email("invalid@abc.com")
                .phone("000000000")
                .createdBy("admin") // name is missing
                .build();

        mockMvc.perform(post("/api/suppliers")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Test to verify that updating a supplier with missing required field 'name'
     * results in a 400 Bad Request response.
     */
    @Test
    void testUpdate_withMissingName_shouldReturnBadRequest() throws Exception {
        SupplierDTO invalid = SupplierDTO.builder()
                .contactName("Jane")
                .email("update@abc.com")
                .phone("999999999")
                .createdBy("admin") // name is missing
                .build();

        mockMvc.perform(put("/api/suppliers/supplier-1")
                        .with(csrf())
                        .with(user("adminuser").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Test to verify that attempting to delete a supplier with existing inventory links
     * results in HTTP 409 Conflict and appropriate error message.
     */
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

