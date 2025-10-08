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
     * Creates new supplier with admin authorization and returns 201 + Location header.
     * @param dto supplier data (ID must be null)
     * @return created supplier with 201 status
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SupplierDTO> create(@Valid @RequestBody SupplierDTO dto) {
        if (dto.getId() != null) {
            // Enterprise Comment: ID consistency validation - prevent client-generated IDs on creation
            // to maintain server-side ID generation control and avoid potential ID conflicts
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID must be null on create");
        }
        SupplierDTO created = supplierService.create(dto);
        // Enterprise Comment: REST Location header pattern - provide resource URI for immediate access
        // enabling client-side navigation and RESTful resource discovery
        return ResponseEntity.created(URI.create("/api/suppliers/" + created.getId()))
                .header(HttpHeaders.LOCATION, "/api/suppliers/" + created.getId())
                .body(created);
    }

    /**
     * Updates existing supplier with path ID taking precedence over body ID.
     * @param id supplier ID from path
     * @param dto updated supplier data
     * @return updated supplier DTO
     */
    @PreAuthorize("hasRole('ADMIN')")
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
     * Deletes supplier with referential integrity checks.
     * @param id supplier ID to delete
     * @return 204 No Content on success
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
