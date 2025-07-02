package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.service.SupplierService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for handling supplier-related API operations.
 */
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    // Service layer is injected using constructor-based dependency injection
    private final SupplierService supplierService;

    /**
     * Fetches all suppliers in the system.
     * Accessible by ADMIN and USER roles.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping
    public ResponseEntity<List<SupplierDTO>> getAll() {
        return ResponseEntity.ok(supplierService.getAll());
    }

    /**
     * Fetch a specific supplier by ID.
     * Accessible by ADMIN and USER roles.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/{id}")
    public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(supplierService.getById(id));
    }

    /**
     * Create a new supplier.
     * Only accessible by ADMIN users.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupplierDTO> create(@RequestBody @Valid SupplierDTO dto) {
        SupplierDTO created = supplierService.save(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * Update an existing supplier by ID.
     * Only accessible by ADMIN users.
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupplierDTO> update(@PathVariable String id, @RequestBody @Valid SupplierDTO dto) {
        return supplierService.update(id, dto)
                .map(updated -> new ResponseEntity<>(updated, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Delete a supplier by ID.
     * Only ADMINs are allowed to perform deletion.
     * Returns HTTP 204 (No Content) on success.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search suppliers by name (partial match).
     * Accessible by both ADMIN and USER roles.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/search")
    public ResponseEntity<List<SupplierDTO>> search(@RequestParam String name) {
        return ResponseEntity.ok(supplierService.findByName(name));
    }
}