package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;

import jakarta.validation.Valid;

import com.smartsupplypro.inventory.service.InventoryItemService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for managing inventory items.
 *
 * <p>Supports CRUD operations and item search, with role-based access control (RBAC).
 * This controller enforces security restrictions and auditing logic,
 * including reason tracking on deletion.
 *
 * <p>Accessible roles:
 * <ul>
 *   <li><b>ADMIN</b>: Full access (create, update, delete)</li>
 *   <li><b>USER</b>: Read and update access only</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/inventory")
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    public InventoryItemController(InventoryItemService inventoryItemService) {
        this.inventoryItemService = inventoryItemService;
    }

    /**
     * Retrieves a list of all inventory items.
     * 
     * <p>Accessible to both ADMIN and USER roles.
     *
     * @return list of inventory items
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping
    public List<InventoryItemDTO> getAll() {
        return inventoryItemService.getAll();
    }

    /**
     * Retrieves a specific inventory item by its ID.
     * 
     * <p>Returns 404 Not Found if the item does not exist.
     *
     * @param id unique identifier of the item
     * @return item details or 404 if not found
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
     * 
     * <p>Accessible only by ADMIN users.
     * Returns HTTP 201 on success, or HTTP 409 if item already exists.
     *
     * @param inventoryItemDTO validated item data
     * @return created item or conflict response
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
     * 
     * <p>Accessible to both ADMIN and USER roles.
     * Returns HTTP 200 if updated, 404 if not found, or 409 on validation conflict.
     *
     * @param id item ID to update
     * @param inventoryItemDTO updated item data
     * @return updated item or appropriate error
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody InventoryItemDTO inventoryItemDTO) {
        try {
            return inventoryItemService.update(id, inventoryItemDTO)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Deletes an inventory item and records the reason.
     * 
     * <p>Only ADMIN users are allowed to delete items.
     * The reason for deletion (e.g., SCRAPPED, RETURNED) is required for audit trails.
     *
     * @param id     inventory item ID
     * @param reason enum representing the stock change reason
     * @return 204 No Content on success
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id,
                                       @RequestParam StockChangeReason reason) {
        inventoryItemService.delete(id, reason);
        return ResponseEntity.noContent().build();
    }

    /**
    * Searches for inventory items by partial or full name,
    * returns paginated results sorted by price (ascending).
    *
    * <p>Accessible by both ADMIN and USER roles.</p>
    *
    * @param name  partial name to search for
    * @param page  page number (default 0)
    * @param size  page size (default 10)
    * @return paginated list of inventory items sorted by price
    */
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')")
    @GetMapping("/search")
    public Page<InventoryItemDTO> searchByNameSortedByPrice(
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        return inventoryItemService.findByNameSortedByPrice(name, pageable);
    }

}
