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

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    /**
     * List all suppliers (USER/ADMIN).
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly()")
    @GetMapping
    public ResponseEntity<List<SupplierDTO>> listAll() {
        return ResponseEntity.ok(supplierService.findAll());
    }

    /**
    * Returns the total number of suppliers.
    * @return JSON number (e.g., 12)
    */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly()")
    @GetMapping("/count")
    public long countSuppliers() {
        return supplierService.countSuppliers();
    }

    /**
     * Get one supplier by id (USER/ADMIN).
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{id}")
    public ResponseEntity<SupplierDTO> getById(@PathVariable String id) {
        return supplierService.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));
    }

    /**
     * Search by (partial) name (USER/ADMIN).
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly()")
    @GetMapping("/search")
    public ResponseEntity<List<SupplierDTO>> search(@RequestParam String name) {
        return ResponseEntity.ok(supplierService.findByName(name));
    }

    /**
     * Create supplier (ADMIN) — returns 201 + Location.
     * DTO validation happens here; duplicate handling is done in the service
     * via DuplicateResourceException (mapped to 409).
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<SupplierDTO> create(@Valid @RequestBody SupplierDTO dto) {
        if (dto.getId() != null) {
            // path/payload mismatch style: controller throws ResponseStatusException in rare cases
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID must be null on create");
        }
        SupplierDTO created = supplierService.create(dto);
        return ResponseEntity.created(URI.create("/api/suppliers/" + created.getId()))
                .header(HttpHeaders.LOCATION, "/api/suppliers/" + created.getId())
                .body(created);
    }

    /**
     * Update supplier (ADMIN). Path id wins; body.id may be absent or mismatched.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<SupplierDTO> update(@PathVariable String id, @Valid @RequestBody SupplierDTO dto) {
        // If body has an id and it doesn't match, signal a payload/path mismatch (400).
        if (dto.getId() != null && !id.equals(dto.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Path id and body id must match");
        }
        SupplierDTO updated = supplierService.update(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete supplier (ADMIN). Service will throw IllegalStateException (409)
     * when there are linked inventory items, per your GlobalExceptionHandler.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
