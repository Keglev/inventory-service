package com.smartsupplypro.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.SupplierService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Web-layer tests for {@link SupplierController}.
 *
 * <p>Scope:
 * <ul>
 *   <li>Verifies security constraints (USER vs ADMIN) via {@code @PreAuthorize}.</li>
 *   <li>Validates error-shaping from the global {@code GlobalExceptionHandler}:
 *       not-found → 404, duplicate/conflict → 409, validation/path-mismatch → 400.</li>
 *   <li>Ensures controller behavior matches project conventions:
 *       <ul>
 *         <li>POST requires {@code id == null} and returns 201 + Location.</li>
 *         <li>PUT accepts body.id absent; if present, it must match the path id.</li>
 *         <li>Read endpoints accessible to USER/ADMIN, write endpoints ADMIN-only.</li>
 *       </ul>
 *   </li>
 * </ul>
 *
 * <p>Notes:
 * <ul>
 *   <li>Uses {@code @WebMvcTest} to restrict the slice to MVC + controller advice; the service is mocked.</li>
 *   <li>Asserts on JSON field {@code $.message} for human-readable error text,
 *       matching your current GlobalExceptionHandler contract.</li>
 *   <li>Includes CSRF tokens on state-changing requests (POST/PUT/DELETE) to
 *       reflect default Spring Security expectations.</li>
 * </ul>
 */
@ActiveProfiles("test")
@WebMvcTest(SupplierController.class)
@Import({ TestSecurityConfig.class, GlobalExceptionHandler.class })
class SupplierControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    /** Mocked service bean injected into the MVC slice. */
    @MockitoBean SupplierService supplierService;

    /** Canonical DTO used in Given-arrange steps across tests. */
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
     * GIVEN a USER role
     * WHEN calling GET /api/suppliers
     * THEN 200 with list payload.
     */
    @Test
    void listAll_asUser_ok() throws Exception {
        given(supplierService.findAll()).willReturn(List.of(dto));

        mockMvc.perform(get("/api/suppliers").with(user("u").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("sup-1"));
    }

    /**
     * GIVEN supplier exists
     * WHEN GET by id
     * THEN 200 with DTO.
     */
    @Test
    void getById_found_asUser_ok() throws Exception {
        given(supplierService.findById("sup-1")).willReturn(Optional.of(dto));

        mockMvc.perform(get("/api/suppliers/sup-1").with(user("u").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Acme GmbH"));
    }

    /**
     * GIVEN supplier does not exist
     * WHEN GET by id
     * THEN mapped to 404 by GlobalExceptionHandler (NoSuchElementException → 404).
     */
    @Test
    void getById_notFound_mapsTo404() throws Exception {
        given(supplierService.findById("missing")).willReturn(Optional.empty());

        mockMvc.perform(get("/api/suppliers/missing").with(user("u").roles("USER")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Supplier not found")));
    }

    /**
     * GIVEN partial name matches
     * WHEN GET /search
     * THEN 200 with filtered list.
     */
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
     * GIVEN ADMIN with valid payload and id == null
     * WHEN POST /api/suppliers
     * THEN 201 Created with Location header + created DTO.
     */
    @Test
    void create_asAdmin_201_withLocation() throws Exception {
        // id must be null on create
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
     * GIVEN ADMIN but payload illegally provides id on create
     * WHEN POST /api/suppliers
     * THEN 400 from controller via ResponseStatusException (path/payload mismatch category).
     */
     @Test
     void create_withIdProvided_returns400() throws Exception {
                mockMvc.perform(post("/api/suppliers")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))) // dto has id
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ID must be null on create")));
     }

     /**
     * GIVEN ADMIN and duplicate name at service/validator
     * WHEN POST /api/suppliers
     * THEN 409 Conflict (DuplicateResourceException → 409 by GlobalExceptionHandler).
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
     * GIVEN ADMIN and consistent ids
     * WHEN PUT /api/suppliers/{id}
     * THEN 200 with updated DTO; path id is authoritative.
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
     * GIVEN ADMIN but body.id != path id
     * WHEN PUT /api/suppliers/{id}
     * THEN 400 via ResponseStatusException (controller-level guard).
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
     * GIVEN ADMIN
     * WHEN DELETE /api/suppliers/{id}
     * THEN 204 No Content on success.
     */
    @Test
    void delete_asAdmin_noContent() throws Exception {
        mockMvc.perform(delete("/api/suppliers/sup-1")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }

    /**
     * GIVEN ADMIN but business constraint prevents deletion (linked items)
     * WHEN DELETE /api/suppliers/{id}
     * THEN 409 Conflict (IllegalStateException → 409).
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

    /** USER cannot create (403). */
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


    /** USER cannot update (403). */
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


    /** USER cannot delete (403). */
    @Test
    void delete_forbiddenForUser() throws Exception {
        mockMvc.perform(delete("/api/suppliers/sup-1")
                        .with(user("u").roles("USER"))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    // ========= DTO validation (controller-level @Valid → 400) =========

    /**
     * Ensures blank/absent name is surfaced as 400 with a field message.
     * The exact message content originates from Bean Validation and handler aggregation.
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
