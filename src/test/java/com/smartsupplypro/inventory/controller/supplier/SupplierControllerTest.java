package com.smartsupplypro.inventory.controller.supplier;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
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

import tools.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.SupplierController;
import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.SupplierService;

/**
 * Tests {@link SupplierController} read and write endpoints covering HTTP contract, RBAC,
 * and REST conventions using {@link MockMvc}.
 */
@ActiveProfiles("test")
@WebMvcTest(SupplierController.class)
@Import({ TestSecurityConfig.class, GlobalExceptionHandler.class })
class SupplierControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean SupplierService supplierService;

    SupplierDTO dto;

    @BeforeEach
    void setUp() {
        dto = SupplierDTO.builder()
                .id("sup-1").name("Acme GmbH").contactName("Alice")
                .phone("+49-123").email("alice@acme.test")
                .createdBy("admin").createdAt(LocalDateTime.now())
                .build();
    }

    private SupplierDTO noId() {
        return SupplierDTO.builder()
                .name(dto.getName()).contactName(dto.getContactName())
                .phone(dto.getPhone()).email(dto.getEmail())
                .createdBy("admin").createdAt(dto.getCreatedAt()).build();
    }

    /** READ endpoints accessible to USER and ADMIN roles. */
    @Nested
    class WhenReading {

        @Test
        void listAll_asUser_ok() throws Exception {
            given(supplierService.findAll()).willReturn(List.of(dto));

            mockMvc.perform(get("/api/suppliers").with(user("u").roles("USER")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].id").value("sup-1"));
        }

        @Test
        void getById_found_asUser_ok() throws Exception {
            given(supplierService.findById("sup-1")).willReturn(Optional.of(dto));

            mockMvc.perform(get("/api/suppliers/sup-1").with(user("u").roles("USER")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Acme GmbH"));
        }

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
    }

    /** Write endpoints restricted to ADMIN role covering creation, update, deletion, and validation. */
    @Nested
    class WhenWritingAsAdmin {

        @Test
        void create_asAdmin_201_withLocation() throws Exception {
            given(supplierService.create(any(SupplierDTO.class))).willReturn(dto);

            mockMvc.perform(post("/api/suppliers")
                            .with(user("admin").roles("ADMIN")).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(noId())))
                    .andExpect(status().isCreated())
                    .andExpect(header().string("Location", "/api/suppliers/sup-1"))
                    .andExpect(jsonPath("$.id").value("sup-1"));
        }

        @Test
        void create_withIdProvided_returns400() throws Exception {
            mockMvc.perform(post("/api/suppliers")
                            .with(user("admin").roles("ADMIN")).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("ID must be null on create")));
        }

        @Test
        void create_duplicateName_mapsTo409() throws Exception {
            given(supplierService.create(any(SupplierDTO.class)))
                    .willThrow(new DuplicateResourceException("Supplier already exists", "name"));

            mockMvc.perform(post("/api/suppliers")
                            .with(user("admin").roles("ADMIN")).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(noId())))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("Supplier already exists"))
                    // The client attaches the conflict to the name input from this attribution
                    // rather than inferring it from the message text.
                    .andExpect(jsonPath("$.fieldErrors.name").value("Supplier already exists"));
        }

        @Test
        void update_asAdmin_ok_pathIdWins() throws Exception {
            SupplierDTO body = SupplierDTO.builder()
                    .id("sup-1").name("Acme Updated").contactName(dto.getContactName())
                    .phone(dto.getPhone()).email(dto.getEmail()).createdBy("admin").build();

            given(supplierService.update(eq("sup-1"), any(SupplierDTO.class))).willReturn(body);

            mockMvc.perform(put("/api/suppliers/sup-1")
                            .with(user("admin").roles("ADMIN")).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Acme Updated"));
        }

        @Test
        void update_mismatchedIds_returns400() throws Exception {
            SupplierDTO body = SupplierDTO.builder()
                    .id("different").name(dto.getName()).contactName(dto.getContactName())
                    .phone(dto.getPhone()).email(dto.getEmail()).createdBy("admin").build();

            mockMvc.perform(put("/api/suppliers/sup-1")
                            .with(user("admin").roles("ADMIN")).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("Path id and body id must match")));
        }

        @Test
        void delete_asAdmin_noContent() throws Exception {
            mockMvc.perform(delete("/api/suppliers/sup-1")
                            .with(user("admin").roles("ADMIN")).with(csrf()))
                    .andExpect(status().isNoContent());
        }

        @Test
        void delete_withLinkedItems_mapsTo409() throws Exception {
            doThrow(new IllegalStateException("Cannot delete supplier with linked items"))
                    .when(supplierService).delete("sup-1");

            mockMvc.perform(delete("/api/suppliers/sup-1")
                            .with(user("admin").roles("ADMIN")).with(csrf()))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("Cannot delete supplier with linked items"));
        }

        @ParameterizedTest
        @NullAndEmptySource
        @ValueSource(strings = {"  "})
        void create_invalidName_400(String badName) throws Exception {
            SupplierDTO create = SupplierDTO.builder()
                    .name(badName).contactName(dto.getContactName())
                    .phone(dto.getPhone()).email(dto.getEmail()).createdBy("admin").build();

            mockMvc.perform(post("/api/suppliers")
                            .with(user("admin").roles("ADMIN")).with(csrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(create)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("name")));
        }
    }
}
