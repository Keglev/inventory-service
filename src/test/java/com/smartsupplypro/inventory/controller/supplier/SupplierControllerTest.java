package com.smartsupplypro.inventory.controller.supplier;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.SupplierController;
import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.SupplierService;

/**
 * MVC tests for SupplierController - HTTP contract, RBAC, and REST conventions.
 * 
 * Validates supplier CRUD operations with role-based access control:
 * - READ operations: USER/ADMIN roles
 * - WRITE operations: ADMIN only
 * 
 * Tests error mapping: 404 (not found), 409 (duplicate/constraint), 400 (validation)
 * REST conventions: POST (id=null, 201+Location), PUT (id match), DELETE (204)
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
@WebMvcTest(SupplierController.class)
@Import({ TestSecurityConfig.class, GlobalExceptionHandler.class })
class SupplierControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    /** Mocked service bean for web layer isolation testing. */
    @MockitoBean SupplierService supplierService;

    /** Sample supplier DTO for test data setup. */
    SupplierDTO dto;

    @BeforeEach
    void setUp() {
        dto = SupplierDTO.builder()
                .id("sup-1")
                .name("Acme GmbH")
                .contactName("Alice")
                .phone("+49-123")
                .email("alice@acme.test")
                .createdBy("admin")
                .createdAt(LocalDateTime.now())
                .build();
    }

    // ========= Read endpoints (USER/ADMIN) =========

    /**
     * Tests supplier list retrieval with USER role.
     * Given: USER role accessing supplier list
     * When: GET /api/suppliers
     * Then: Returns 200 with supplier list
     */
    @Test
    void listAll_asUser_ok() throws Exception {
        given(supplierService.findAll()).willReturn(List.of(dto));

        mockMvc.perform(get("/api/suppliers").with(user("u").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("sup-1"));
    }

    /**
     * Tests single supplier retrieval by ID with USER role.
     * Given: USER role accessing specific supplier
     * When: GET /api/suppliers/{id}
     * Then: Returns 200 with supplier details
     */
    @Test
    void getById_found_asUser_ok() throws Exception {
        given(supplierService.findById("sup-1")).willReturn(Optional.of(dto));

        mockMvc.perform(get("/api/suppliers/sup-1").with(user("u").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Acme GmbH"));
    }

    /**
     * Tests 404 response for non-existent supplier.
     * Given: User requests non-existent supplier
     * When: GET /api/suppliers/{id} with missing ID
     * Then: Returns 404 Not Found
     */
    @Test
    void getById_notFound_mapsTo404() throws Exception {
        given(supplierService.findById("missing")).willReturn(Optional.empty());

        mockMvc.perform(get("/api/suppliers/missing").with(user("u").roles("USER")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Supplier not found")));
    }

    @Test
    void search_byName_asUser_ok() throws Exception {
        given(supplierService.findByName("ac")).willReturn(List.of(dto));

        mockMvc.perform(get("/api/suppliers/search")
                        .param("name", "ac")
                        .with(user("u").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("alice@acme.test"));
    }

    // ========= Write endpoints (ADMIN only) =========

    /**
     * Tests successful supplier creation with ADMIN role.
     * Given: ADMIN with valid supplier payload (id=null)
     * When: POST /api/suppliers
     * Then: Returns 201 Created with Location header
     */
    @Test
    void create_asAdmin_201_withLocation() throws Exception {
        SupplierDTO create = SupplierDTO.builder()
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")
                .createdAt(dto.getCreatedAt())
                .build();
                
        given(supplierService.create(any(SupplierDTO.class)))
                .willAnswer(inv -> SupplierDTO.builder()
                        .id("sup-1")
                        .name(create.getName())
                        .contactName(create.getContactName())
                        .phone(create.getPhone())
                        .email(create.getEmail())
                        .createdBy(create.getCreatedBy())
                        .createdAt(create.getCreatedAt())
                        .build());

        mockMvc.perform(post("/api/suppliers")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/suppliers/sup-1"))
                .andExpect(jsonPath("$.id").value("sup-1"));
        }

     /**
     * Tests rejection of supplier creation with pre-assigned ID.
     * Given: ADMIN provides supplier payload with ID populated
     * When: POST /api/suppliers with ID-containing payload
     * Then: Returns 400 Bad Request (REST convention violation)
     */
     @Test
     void create_withIdProvided_returns400() throws Exception {
                mockMvc.perform(post("/api/suppliers")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ID must be null on create")));
     }

     /**
     * Tests duplicate supplier name handling.
     * Given: ADMIN attempts to create supplier with existing name
     * When: POST /api/suppliers with duplicate name
     * Then: Returns 409 Conflict
     */
     @Test
     void create_duplicateName_mapsTo409() throws Exception {
         SupplierDTO create = SupplierDTO.builder()
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")
                .build();

         given(supplierService.create(any(SupplierDTO.class)))
                .willThrow(new DuplicateResourceException("Supplier already exists"));

         mockMvc.perform(post("/api/suppliers")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Supplier already exists"));
    }

    /**
     * Tests successful supplier update with ADMIN role.
     * Given: ADMIN with valid supplier update and matching IDs
     * When: PUT /api/suppliers/{id}
     * Then: Returns 200 with updated supplier
     */
    @Test
    void update_asAdmin_ok_pathIdWins() throws Exception {
        SupplierDTO body = SupplierDTO.builder()
                .id("sup-1")
                .name("Acme Updated")
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")
                .build();

        given(supplierService.update(eq("sup-1"), any(SupplierDTO.class))).willReturn(body);

        mockMvc.perform(put("/api/suppliers/sup-1")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Acme Updated"));
    }
    
    /**
     * Tests rejection of supplier update with mismatched IDs.
     * Given: ADMIN with payload where body.id != path.id
     * When: PUT /api/suppliers/{id} with inconsistent IDs
     * Then: Returns 400 Bad Request
     */
    @Test
    void update_mismatchedIds_returns400() throws Exception {
        SupplierDTO body = SupplierDTO.builder()
                .id("different")
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")
                .build();

        mockMvc.perform(put("/api/suppliers/sup-1")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Path id and body id must match")));
    }

    /**
     * Tests successful supplier deletion by ADMIN.
     * Given: ADMIN requests deletion of existing supplier
     * When: DELETE /api/suppliers/{id}
     * Then: Returns 204 No Content
     */
    @Test
    void delete_asAdmin_noContent() throws Exception {
        mockMvc.perform(delete("/api/suppliers/sup-1")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    /**
     * Tests supplier deletion with business constraints.
     * Given: ADMIN attempts to delete supplier with linked items
     * When: DELETE /api/suppliers/{id} for supplier with dependencies
     * Then: Returns 409 Conflict
     */
    @Test
    void delete_withLinkedItems_mapsTo409() throws Exception {
        doThrow(new IllegalStateException("Cannot delete supplier with linked items"))
                .when(supplierService).delete("sup-1");

        mockMvc.perform(delete("/api/suppliers/sup-1")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Cannot delete supplier with linked items"));
    }

    // ========= Security guards =========

    /**
     * Tests USER role cannot create suppliers.
     * Given: USER role attempts to create supplier
     * When: POST /api/suppliers with USER authentication
     * Then: Returns 403 Forbidden
     */
    @Test
    void create_forbiddenForUser() throws Exception {
        SupplierDTO create = SupplierDTO.builder()
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("user")
                .build();

        mockMvc.perform(post("/api/suppliers")
                        .with(user("u").roles("USER"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isForbidden());
    }

    /**
     * Tests USER role cannot update suppliers.
     * Given: USER role attempts to update supplier
     * When: PUT /api/suppliers/{id} with USER authentication
     * Then: Returns 403 Forbidden
     */
    @Test
    void update_forbiddenForUser() throws Exception {
        SupplierDTO body = SupplierDTO.builder()
                .id("sup-1")
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("user")
                .build();

        mockMvc.perform(put("/api/suppliers/sup-1")
                        .with(user("u").roles("USER"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    /**
     * Tests USER role cannot delete suppliers.
     * Given: USER role attempts to delete supplier
     * When: DELETE /api/suppliers/{id} with USER authentication
     * Then: Returns 403 Forbidden
     */
    @Test
    void delete_forbiddenForUser() throws Exception {
        mockMvc.perform(delete("/api/suppliers/sup-1")
                        .with(user("u").roles("USER"))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    // ========= DTO validation (controller-level @Valid → 400) =========

    /**
     * Tests invalid supplier name validation.
     * Given: ADMIN attempts to create supplier with invalid name (null/empty/blank)
     * When: POST /api/suppliers with invalid name
     * Then: Returns 400 Bad Request
     */
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  "})
    void create_invalidName_400(String badName) throws Exception {
        SupplierDTO create = SupplierDTO.builder()
                .name(badName)
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")
                .build();

        mockMvc.perform(post("/api/suppliers")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("name")));
    }

}
