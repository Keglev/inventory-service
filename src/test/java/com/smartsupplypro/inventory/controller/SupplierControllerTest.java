package com.smartsupplypro.inventory.controller;

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
import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.SupplierService;

/**
 * Comprehensive test suite for SupplierController validating supplier management operations
 * in the Smart Supply Pro inventory management system.
 *
 * <p><strong>ENTERPRISE BUSINESS CONTEXT:</strong> Supplier management is critical for inventory
 * operations, procurement workflows, and supply chain integrity. This controller handles
 * supplier CRUD operations with role-based access control ensuring only administrators
 * can modify supplier data while users can access supplier information for inventory operations.</p>
 * 
 * <p><strong>TECHNICAL SCOPE:</strong> Tests web layer validation, security constraints (USER vs ADMIN)
 * via @PreAuthorize annotations, error handling through GlobalExceptionHandler, and REST API
 * conventions for supplier resource management. Validates complete supplier lifecycle operations.</p>
 * 
 * <p><strong>SECURITY TESTING:</strong> Ensures proper role-based access control where read operations
 * are accessible to USER/ADMIN roles while write operations (create/update/delete) are restricted
 * to ADMIN role only, protecting critical supplier relationship data.</p>
 *
 * <p><strong>ERROR HANDLING VALIDATION:</strong> Verifies comprehensive error mapping:
 * <ul>
 *   <li>NoSuchElementException → 404 Not Found for missing suppliers</li>
 *   <li>DuplicateResourceException → 409 Conflict for supplier name conflicts</li>
 *   <li>ValidationException → 400 Bad Request for invalid supplier data</li>
 *   <li>IllegalStateException → 409 Conflict for business constraint violations</li>
 * </ul>
 *
 * <p><strong>REST API CONVENTIONS:</strong> Validates standard REST patterns:
 * <ul>
 *   <li>POST requires id == null and returns 201 Created with Location header</li>
 *   <li>PUT accepts body.id absent; if present, must match path id for consistency</li>
 *   <li>DELETE returns 204 No Content on successful removal</li>
 *   <li>GET operations return appropriate supplier data with role-based filtering</li>
 * </ul>
 *
 * <p><strong>TEST ARCHITECTURE:</strong> Uses @WebMvcTest slice with mocked SupplierService,
 * TestSecurityConfig for authentication simulation, and GlobalExceptionHandler integration
 * for comprehensive error response validation.</p>
 */
@ActiveProfiles("test")
@WebMvcTest(SupplierController.class)
@Import({ TestSecurityConfig.class, GlobalExceptionHandler.class })
class SupplierControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    /** 
     * Mocked service bean injected into the MVC slice for supplier operations testing.
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Isolates web layer testing from business logic,
     * enabling focused validation of HTTP request/response handling, security constraints,
     * and error mapping without dependency on actual supplier service implementation.</p>
     */
    @MockitoBean SupplierService supplierService;

    /** 
     * Canonical supplier DTO used in Given-arrange steps across test scenarios.
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Represents realistic supplier data for testing
     * supplier management workflows, including contact information, audit fields, and
     * business identifiers used in procurement and inventory operations.</p>
     */
    SupplierDTO dto;

    @BeforeEach
    @SuppressWarnings("unused") // used by JUnit via reflection
    void setUp() {
        // ENTERPRISE: Create realistic supplier data representing typical B2B relationships
        dto = SupplierDTO.builder()
                .id("sup-1")
                .name("Acme GmbH")                    // Business entity name for procurement
                .contactName("Alice")                 // Primary contact for supplier relations
                .phone("+49-123")                     // International contact format
                .email("alice@acme.test")             // Business communication channel
                .createdBy("admin")                   // Audit trail for supplier onboarding
                .createdAt(LocalDateTime.now())       // Temporal audit for compliance
                .build();
    }

    // ========= Read endpoints (USER/ADMIN) =========

    /**
     * Validates supplier list retrieval with USER role permissions.
     * 
     * <p><strong>GIVEN:</strong> User with USER role accessing supplier list</p>
     * <p><strong>WHEN:</strong> GET /api/suppliers is called with USER authentication</p>
     * <p><strong>THEN:</strong> All suppliers are returned for inventory operation planning</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Users need supplier visibility for inventory
     * planning, purchase order creation, and supply chain analysis without modification rights.</p>
     */
    @Test
    void listAll_asUser_ok() throws Exception {
        // GIVEN: Supplier data available for inventory operations
        given(supplierService.findAll()).willReturn(List.of(dto));

        // WHEN: USER role requests supplier list for inventory planning
        mockMvc.perform(get("/api/suppliers").with(user("u").roles("USER")))
                // THEN: Suppliers are accessible for read-only inventory operations
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("sup-1"));
    }

    /**
     * Validates single supplier retrieval by ID with USER role permissions.
     * 
     * <p><strong>GIVEN:</strong> User with USER role accessing specific supplier</p>
     * <p><strong>WHEN:</strong> GET /api/suppliers/{id} is called with USER authentication</p>
     * <p><strong>THEN:</strong> The requested supplier is returned for inventory operations</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Users need access to specific supplier details
     * for order processing, inventory audits, and supplier performance reviews without
     * modification capabilities.</p>
     */
    @Test
    void getById_found_asUser_ok() throws Exception {
        given(supplierService.findById("sup-1")).willReturn(Optional.of(dto));

        mockMvc.perform(get("/api/suppliers/sup-1").with(user("u").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Acme GmbH"));
    }

    /**
     * Validates proper 404 Not Found response when supplier ID does not exist.
     * 
     * <p><strong>GIVEN:</strong> User with USER role requests non-existent supplier</p>
     * <p><strong>WHEN:</strong> GET /api/suppliers/{id} is called with missing ID</p>
     * <p><strong>THEN:</strong> 404 Not Found is returned indicating supplier absence</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Accurate error reporting is essential for
     * inventory operations to handle missing supplier references gracefully during
     * order processing and supply chain management.</p>
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
     * Validates successful supplier creation with ADMIN role and proper REST conventions.
     * 
     * <p><strong>GIVEN:</strong> ADMIN user with valid supplier payload (id == null)</p>
     * <p><strong>WHEN:</strong> POST /api/suppliers with complete supplier data</p>
     * <p><strong>THEN:</strong> 201 Created with Location header and created supplier DTO</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> New supplier onboarding is critical for expanding
     * procurement capabilities and supply chain diversity. Only administrators can establish
     * new supplier relationships to maintain data integrity and business relationship control.</p>
     */
    @Test
    void create_asAdmin_201_withLocation() throws Exception {
        // ENTERPRISE: Create new supplier payload without ID for proper REST semantics
        SupplierDTO create = SupplierDTO.builder()
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")               // Audit trail for supplier onboarding
                .createdAt(dto.getCreatedAt())
                .build();

        // GIVEN: Service will create supplier with generated ID
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
     * Validates rejection of supplier creation with pre-assigned ID.
     * 
     * <p><strong>GIVEN:</strong> ADMIN user provides supplier payload with ID field populated</p>
     * <p><strong>WHEN:</strong> POST /api/suppliers with ID-containing payload</p>
     * <p><strong>THEN:</strong> 400 Bad Request due to REST convention violation</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Enforces proper REST semantics where POST operations
     * should not include resource IDs. Prevents ID conflicts and maintains consistent resource
     * creation patterns in supplier management workflows.</p>
     */
     @Test
     void create_withIdProvided_returns400() throws Exception {
                // GIVEN: ADMIN attempts to create supplier with pre-assigned ID (invalid)
                // WHEN: POST request made with ID-containing payload (violates REST convention)
                mockMvc.perform(post("/api/suppliers")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))) // ENTERPRISE: dto has id - violates creation semantics
                // THEN: Request is rejected to maintain REST API consistency
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("ID must be null on create")));
     }

     /**
     * Validates handling of duplicate supplier name conflicts.
     * 
     * <p><strong>GIVEN:</strong> ADMIN attempts to create supplier with existing name</p>
     * <p><strong>WHEN:</strong> POST /api/suppliers with duplicate supplier name</p>
     * <p><strong>THEN:</strong> 409 Conflict via DuplicateResourceException mapping</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Prevents duplicate supplier names that could
     * cause confusion in procurement operations, purchase order processing, and supplier
     * relationship management. Maintains data integrity for supply chain operations.</p>
     */
     @Test
     void create_duplicateName_mapsTo409() throws Exception {
         // ENTERPRISE: Create supplier with potentially conflicting name
         SupplierDTO create = SupplierDTO.builder()
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")
                .build();

         // GIVEN: Service will reject due to duplicate supplier name
         given(supplierService.create(any(SupplierDTO.class)))
                .willThrow(new DuplicateResourceException("Supplier already exists"));

         // WHEN: ADMIN attempts to create supplier with duplicate name
         mockMvc.perform(post("/api/suppliers")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                // THEN: Conflict error prevents supplier name duplication
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Supplier already exists"));
    }

    /**
     * Validates successful supplier update with consistent ID handling.
     * 
     * <p><strong>GIVEN:</strong> ADMIN user with valid supplier update and consistent IDs</p>
     * <p><strong>WHEN:</strong> PUT /api/suppliers/{id} with matching path and body IDs</p>
     * <p><strong>THEN:</strong> Supplier is updated successfully with path ID being authoritative</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Supplier updates are critical for maintaining
     * accurate contact information, business relationships, and procurement workflows.
     * Path ID authority ensures consistent resource identification.</p>
     */
    @Test
    void update_asAdmin_ok_pathIdWins() throws Exception {
        // ENTERPRISE: Create updated supplier data with consistent ID
        SupplierDTO body = SupplierDTO.builder()
                .id("sup-1")
                .name("Acme Updated")              // Business name change for rebranding
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")
                .build();

        // GIVEN: Service will process supplier update successfully
        given(supplierService.update(eq("sup-1"), any(SupplierDTO.class))).willReturn(body);

        // WHEN: ADMIN updates supplier with consistent ID references
        mockMvc.perform(put("/api/suppliers/sup-1")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                // THEN: Supplier update is processed with updated business information
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Acme Updated"));
    }
    
    /**
     * Validates rejection of supplier update with mismatched IDs.
     * 
     * <p><strong>GIVEN:</strong> ADMIN user with supplier payload where body.id != path.id</p>
     * <p><strong>WHEN:</strong> PUT /api/suppliers/{id} with inconsistent ID references</p>
     * <p><strong>THEN:</strong> 400 Bad Request via controller-level validation guard</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Prevents accidental supplier data corruption
     * by ensuring path and payload IDs match. Maintains data integrity in supplier
     * management operations and prevents update confusion in procurement workflows.</p>
     */
    @Test
    void update_mismatchedIds_returns400() throws Exception {
        // ENTERPRISE: Create supplier payload with mismatched ID (validation error)
        SupplierDTO body = SupplierDTO.builder()
                .id("different")                  // Mismatched ID creates data integrity risk
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")
                .build();

        // WHEN: ADMIN attempts update with mismatched IDs (path vs body)
        mockMvc.perform(put("/api/suppliers/sup-1")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                // THEN: Request is rejected to prevent data integrity issues
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Path id and body id must match")));
    }

    /**
     * Validates successful supplier deletion by ADMIN.
     * 
     * <p><strong>GIVEN:</strong> ADMIN user requests deletion of existing supplier</p>
     * <p><strong>WHEN:</strong> DELETE /api/suppliers/{id} with valid supplier ID</p>
     * <p><strong>THEN:</strong> 204 No Content indicates successful deletion</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Supplier deletion is critical for maintaining
     * accurate vendor databases when business relationships end or suppliers become inactive.
     * Only administrators can remove suppliers to protect procurement data integrity.</p>
     */
    @Test
    void delete_asAdmin_noContent() throws Exception {
        // WHEN: ADMIN requests supplier deletion for business relationship termination
        mockMvc.perform(delete("/api/suppliers/sup-1")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf()))
                // THEN: Supplier is successfully removed from the system
                .andExpect(status().isNoContent());
    }

    /**
     * Validates proper handling of supplier deletion with business constraints.
     * 
     * <p><strong>GIVEN:</strong> ADMIN attempts to delete supplier with linked inventory items</p>
     * <p><strong>WHEN:</strong> DELETE /api/suppliers/{id} for supplier with dependencies</p>
     * <p><strong>THEN:</strong> 409 Conflict prevents deletion due to business constraints</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Prevents orphaned inventory items by blocking
     * deletion of suppliers with active inventory relationships. Maintains referential
     * integrity for procurement tracking and supply chain data consistency.</p>
     */
    @Test
    void delete_withLinkedItems_mapsTo409() throws Exception {
        // GIVEN: Supplier has linked inventory items (business constraint violation)
        doThrow(new IllegalStateException("Cannot delete supplier with linked items"))
                .when(supplierService).delete("sup-1");

        // WHEN: ADMIN attempts to delete supplier with active inventory relationships
        mockMvc.perform(delete("/api/suppliers/sup-1")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf()))
                // THEN: Deletion is prevented to maintain referential integrity
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Cannot delete supplier with linked items"));
    }

    // ========= Security guards =========

    /**
     * Validates that USER role cannot create suppliers (403 Forbidden).
     * 
     * <p><strong>GIVEN:</strong> USER role attempts to create new supplier</p>
     * <p><strong>WHEN:</strong> POST /api/suppliers with USER authentication</p>
     * <p><strong>THEN:</strong> 403 Forbidden prevents unauthorized supplier creation</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Supplier creation requires administrative
     * privileges to maintain data integrity and control over business relationships
     * that affect procurement, contracts, and supply chain operations.</p>
     */
    @Test
    void create_forbiddenForUser() throws Exception {
        // ENTERPRISE: USER attempts unauthorized supplier creation
        SupplierDTO create = SupplierDTO.builder()
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("user")
                .build();

        // WHEN: USER attempts to create supplier without proper authorization
        mockMvc.perform(post("/api/suppliers")
                        .with(user("u").roles("USER"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                // THEN: Access is denied to protect supplier data integrity
                .andExpect(status().isForbidden());
    }

    /**
     * Validates that USER role cannot update suppliers (403 Forbidden).
     * 
     * <p><strong>GIVEN:</strong> USER role attempts to update existing supplier</p>
     * <p><strong>WHEN:</strong> PUT /api/suppliers/{id} with USER authentication</p>
     * <p><strong>THEN:</strong> 403 Forbidden prevents unauthorized supplier modification</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Supplier modification affects procurement
     * workflows, contract management, and supply chain integrity. Only administrators
     * should modify supplier data to prevent unauthorized business relationship changes.</p>
     */
    @Test
    void update_forbiddenForUser() throws Exception {
        // ENTERPRISE: USER attempts unauthorized supplier modification
        SupplierDTO body = SupplierDTO.builder()
                .id("sup-1")
                .name(dto.getName())
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("user")
                .build();

        // WHEN: USER attempts to update supplier without proper authorization
        mockMvc.perform(put("/api/suppliers/sup-1")
                        .with(user("u").roles("USER"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                // THEN: Access is denied to protect supplier relationship integrity
                .andExpect(status().isForbidden());
    }

    /**
     * Validates that USER role cannot delete suppliers (403 Forbidden).
     * 
     * <p><strong>GIVEN:</strong> USER role attempts to delete existing supplier</p>
     * <p><strong>WHEN:</strong> DELETE /api/suppliers/{id} with USER authentication</p>
     * <p><strong>THEN:</strong> 403 Forbidden prevents unauthorized supplier deletion</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Supplier deletion affects supply chain
     * continuity and procurement operations. Only administrators should remove suppliers
     * to prevent accidental loss of critical business relationship data.</p>
     */
    @Test
    void delete_forbiddenForUser() throws Exception {
        // WHEN: USER attempts unauthorized supplier deletion
        mockMvc.perform(delete("/api/suppliers/sup-1")
                        .with(user("u").roles("USER"))
                        .with(csrf()))
                // THEN: Access is denied to protect supply chain data integrity
                .andExpect(status().isForbidden());
    }

    // ========= DTO validation (controller-level @Valid → 400) =========

    /**
     * Validates proper handling of invalid supplier name data.
     * 
     * <p><strong>GIVEN:</strong> ADMIN attempts to create supplier with invalid name (null/empty/blank)</p>
     * <p><strong>WHEN:</strong> POST /api/suppliers with invalid name field</p>
     * <p><strong>THEN:</strong> 400 Bad Request with field validation error message</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Supplier names are critical business identifiers
     * used in procurement processes, contracts, and financial reporting. Validation ensures
     * all suppliers have meaningful business names for operational clarity.</p>
     */
    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  "})
    void create_invalidName_400(String badName) throws Exception {
        // ENTERPRISE: Create supplier with invalid name for validation testing
        SupplierDTO create = SupplierDTO.builder()
                .name(badName)                    // Invalid name triggers validation error
                .contactName(dto.getContactName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .createdBy("admin")
                .build();

        // WHEN: ADMIN attempts to create supplier with invalid name data
        mockMvc.perform(post("/api/suppliers")
                        .with(user("admin").roles("ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(create)))
                // THEN: Validation error prevents supplier creation with incomplete data
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("name")));
    }

}
