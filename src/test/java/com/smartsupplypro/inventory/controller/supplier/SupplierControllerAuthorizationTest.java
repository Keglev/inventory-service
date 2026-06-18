package com.smartsupplypro.inventory.controller.supplier;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.SupplierController;
import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.SupplierService;

/**
 * Tests {@link SupplierController} RBAC enforcement ensuring create, update, and delete
 * endpoints return 403 for the USER role using {@link MockMvc}.
 */
@ActiveProfiles("test")
@WebMvcTest(SupplierController.class)
@Import({ TestSecurityConfig.class, GlobalExceptionHandler.class })
class SupplierControllerAuthorizationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean SupplierService supplierService;

    SupplierDTO dto;

    @BeforeEach
    void setUp() {
        dto = SupplierDTO.builder()
                .id("sup-1")
                .name("Acme GmbH")
                .contactName("Alice")
                .phone("+49-123")
                .email("alice@acme.test")
                .createdBy("user")
                .createdAt(LocalDateTime.now())
                .build();
    }

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

    @Test
    void delete_forbiddenForUser() throws Exception {
        mockMvc.perform(delete("/api/suppliers/sup-1")
                        .with(user("u").roles("USER"))
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }
}
