package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.service.InventoryItemService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    public InventoryItemController(InventoryItemService inventoryItemService) {
        this.inventoryItemService = inventoryItemService;
    }

    /**
     * Returns all inventory items.
     * Accessible by both ADMIN and USER roles.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping
    public List<InventoryItemDTO> getAll() {
        return inventoryItemService.getAll();
    }

    /**
     * Retrieves an inventory item by ID.
     * Returns 404 if not found.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> getById(@PathVariable String id) {
        return inventoryItemService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Creates a new inventory item.
     * Only accessible by ADMIN users.
     * Returns 201 Created on success or 409 Conflict if duplicate.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody InventoryItemDTO inventoryItemDTO) {
        try {
            InventoryItemDTO savedItem = inventoryItemService.save(inventoryItemDTO);
            return new ResponseEntity<>(savedItem, HttpStatus.CREATED);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Updates an existing inventory item.
     * Accessible by ADMIN and USER roles.
     * Returns 200 OK on success, 404 if not found, 409 if validation fails.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody InventoryItemDTO inventoryItemDTO) {
        try {
            return inventoryItemService.update(id, inventoryItemDTO)
                    .map(updatedItem -> ResponseEntity.ok(updatedItem))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Deletes an inventory item by ID and logs the reason.
     * Only accessible by ADMIN users.
     * Reason is required to ensure auditability.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       @RequestParam StockChangeReason reason) {
        inventoryItemService.delete(id, reason);
        return ResponseEntity.noContent().build();
    }

    /**
     * Searches inventory items by name.
     * Accessible by both ADMIN and USER roles.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/search")
    public List<InventoryItemDTO> searchByName(@RequestParam String name) {
        return inventoryItemService.findByName(name);
    }
}
