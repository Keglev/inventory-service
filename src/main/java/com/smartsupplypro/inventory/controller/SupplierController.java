package com.smartsupplypro.inventory.controller;

import java.net.URI;
import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.service.SupplierService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * REST controller for supplier management with full CRUD operations and search.
 * Supports role-based authorization (USER read-only, ADMIN full access).
 * @see SupplierService
 * @see controller-patterns.md for REST API patterns
 */
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * Lists all suppliers with optional demo readonly access.
     * @return list of supplier DTOs
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping
    public ResponseEntity<List<SupplierDTO>> listAll() {
        return ResponseEntity.ok(supplierService.findAll());
    }

    /**
     * Returns total count of suppliers in system.
     * @return supplier count as long value
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/count")
    public long countSuppliers() {
        return supplierService.countSuppliers();
    }

    /**
     * Retrieves supplier by unique identifier.
     * @param id supplier ID
     * @return supplier DTO or 404 if not found
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
        return supplierService.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));
    }

    /**
     * Searches suppliers by partial name match.
     * @param name partial or full supplier name
     * @return list of matching suppliers
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/search")
    public ResponseEntity<List<SupplierDTO>> search(@RequestParam String name) {
        return ResponseEntity.ok(supplierService.findByName(name));
    }

    /**
     * Creates new supplier (ADMIN only).
     *
     * <p><b>Authorization</b>:
     * - Requires ROLE_ADMIN and non-demo mode (read-write access)
     * - Demo users receive 403 Forbidden with demo mode message</p>
     *
     * <p><b>REST Pattern</b>: Returns 201 Created with Location header for resource discovery</p>
     *
     * @param dto supplier data (ID must be null for creation)
     * @return created supplier with 201 status and Location header
     * @throws ResponseStatusException 400 if ID is not null
     * @throws ResponseStatusException 403 if user is in demo mode
    */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @PostMapping
    public ResponseEntity<SupplierDTO> create(@Valid @RequestBody SupplierDTO dto) {
        if (dto.getId() != null) {
            // ID consistency validation - prevent client-generated IDs on creation
            // to maintain server-side ID generation control and avoid potential ID conflicts
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID must be null on create");
        }
        SupplierDTO created = supplierService.create(dto);
        // REST Location header pattern - provide resource URI for immediate access
        // enabling client-side navigation and RESTful resource discovery
        return ResponseEntity.created(URI.create("/api/suppliers/" + created.getId()))
                .header(HttpHeaders.LOCATION, "/api/suppliers/" + created.getId())
                .body(created);
    }

    /**
     * Updates existing supplier (ADMIN only).
     *
     * <p><b>Authorization</b>:
     * - Requires ROLE_ADMIN and non-demo mode (read-write access)
     * - Demo users receive 403 Forbidden with demo mode message</p>
     *
     * <p><b>ID Consistency</b>: Path ID takes precedence; body ID must match or be null</p>
     *
     * @param id supplier ID from path parameter
     * @param dto updated supplier data (id in body is ignored for consistency)
     * @return updated supplier DTO
     * @throws ResponseStatusException 400 if path ID and body ID mismatch
     * @throws ResponseStatusException 404 if supplier not found
     * @throws ResponseStatusException 403 if user is in demo mode
     */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @PutMapping("/{id}")
    public ResponseEntity<SupplierDTO> update(@PathVariable String id, @Valid @RequestBody SupplierDTO dto) {
        // Enterprise Comment: Path vs body ID validation - ensure API contract consistency
        // by preventing mismatched identifiers that could lead to unintended updates
        if (dto.getId() != null && !id.equals(dto.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Path id and body id must match");
        }
        SupplierDTO updated = supplierService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deletes supplier (ADMIN only).
     *
     * <p><b>Authorization</b>:
     * - Requires ROLE_ADMIN and non-demo mode (read-write access)
     * - Demo users receive 403 Forbidden with demo mode message</p>
     *
     * <p><b>Referential Integrity</b>: Supplier deletion may cascade or be blocked based on business rules</p>
     *
     * @param id supplier ID to delete
     * @return 204 No Content on success
     * @throws ResponseStatusException 404 if supplier not found
     * @throws ResponseStatusException 403 if user is in demo mode
     */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
