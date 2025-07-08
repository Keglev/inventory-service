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
 * REST controller for managing supplier-related operations.
 *
 * <p>This controller provides secure endpoints to:
 * <ul>
 *     <li>Create, update, and delete suppliers (ADMIN only)</li>
 *     <li>Search and retrieve suppliers (ADMIN and USER)</li>
 * </ul>
 *
 * <p>Built for frontend/backend separation with role-based access control (RBAC).
 */
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * Retrieves a list of all suppliers.
     * 
     * <p>Accessible to both ADMIN and USER roles.
     *
     * @return list of all registered suppliers
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping
    public ResponseEntity<List<SupplierDTO>> getAll() {
        return ResponseEntity.ok(supplierService.getAll());
    }

    /**
     * Retrieves a specific supplier by its ID.
     * 
     * <p>Accessible to both ADMIN and USER roles.
     * 
     * @param id supplier's unique identifier
     * @return supplier details
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/{id}")
    public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(supplierService.getById(id));
    }

    /**
     * Creates a new supplier entry.
     * 
     * <p>Only accessible to ADMIN users.
     * Returns HTTP 201 Created on success.
     *
     * @param dto validated supplier data
     * @return newly created supplier
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupplierDTO> create(@RequestBody @Valid SupplierDTO dto) {
        SupplierDTO created = supplierService.save(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * Updates an existing supplier's data by ID.
     * 
     * <p>Only accessible to ADMIN users.
     * Returns HTTP 200 OK if updated, or 404 Not Found if the supplier does not exist.
     *
     * @param id  supplier ID to update
     * @param dto updated supplier data
     * @return updated supplier or 404 if not found
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupplierDTO> update(@PathVariable String id, @RequestBody @Valid SupplierDTO dto) {
        return supplierService.update(id, dto)
                .map(updated -> new ResponseEntity<>(updated, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Deletes a supplier by ID.
     * 
     * <p>Only ADMIN users are authorized to perform this operation.
     * 
     * <p>Deletion may be prevented if related inventory items exist.
     * 
     * @param id supplier ID
     * @return HTTP 204 No Content on success
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Searches suppliers by partial or full name match.
     * 
     * <p>Useful for UI autocomplete and filtered lists.
     * Accessible to both ADMIN and USER roles.
     *
     * @param name name or fragment to search for
     * @return list of matching suppliers
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/search")
    public ResponseEntity<List<SupplierDTO>> search(@RequestParam String name) {
        return ResponseEntity.ok(supplierService.findByName(name));
    }
}
