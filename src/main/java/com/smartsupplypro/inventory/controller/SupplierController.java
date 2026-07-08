package com.smartsupplypro.inventory.controller;

import java.net.URI;
import java.util.List;
import java.util.NoSuchElementException;

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
 * REST controller for supplier resource operations.
 *
 * <p>All endpoints require authentication. Write operations
 * are restricted to ADMIN role.</p>
 *
 * @see SupplierService
 */
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * Returns all suppliers as a plain list (no pagination).
     *
     * @return all suppliers
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping
    public ResponseEntity<List<SupplierDTO>> listAll() {
        return ResponseEntity.ok(supplierService.findAll());
    }

    /**
     * Returns the total supplier count.
     *
     * @return number of suppliers
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/count")
    public long countSuppliers() {
        return supplierService.countSuppliers();
    }

    /**
     * Retrieves a supplier by ID.
     *
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
     * Searches suppliers by name (case-insensitive partial match).
     *
     * @param name search term
     * @return matching suppliers
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/search")
    public ResponseEntity<List<SupplierDTO>> search(@RequestParam String name) {
        return ResponseEntity.ok(supplierService.findByName(name));
    }

    /**
     * Creates a new supplier.
     *
     * @param dto supplier data (ID must be null)
     * @return 201 Created with Location header and created supplier
     * @throws ResponseStatusException 400 if ID is not null
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SupplierDTO> create(@Valid @RequestBody SupplierDTO dto) {
        if (dto.getId() != null) {
            // client-generated IDs rejected to enforce server-side generation
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID must be null on create");
        }
        SupplierDTO created = supplierService.create(dto);
        return ResponseEntity.created(URI.create("/api/suppliers/" + created.getId())).body(created);
    }

    /**
     * Replaces an existing supplier.
     *
     * @param id  supplier ID from path
     * @param dto updated supplier data
     * @return updated supplier
     * @throws ResponseStatusException 400 if path ID and body ID mismatch
     * @throws ResponseStatusException 404 if supplier not found
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<SupplierDTO> update(@PathVariable String id, @Valid @RequestBody SupplierDTO dto) {
        if (dto.getId() != null && !id.equals(dto.getId())) {
            // prevent mismatched identifiers that could lead to unintended updates
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Path id and body id must match");
        }
        return ResponseEntity.ok(supplierService.update(id, dto));
    }

    /**
     * Deletes a supplier.
     *
     * @param id supplier ID to delete
     * @return 204 No Content on success
     * @throws ResponseStatusException 404 if supplier not found
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
