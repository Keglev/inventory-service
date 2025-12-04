package com.smartsupplypro.inventory.controller;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * Inventory item REST controller for CRUD operations.
 *
 * <p>Provides item management with role-based authorization and validation.
 * Follows standard HTTP status conventions for REST APIs.</p>
 *
 * @see InventoryItemService
 * @see <a href="file:../../../../../../docs/architecture/patterns/controller-patterns.md">Controller Patterns</a>
 */
@RestController
@RequestMapping("/api/inventory")
@Validated
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    public InventoryItemController(InventoryItemService inventoryItemService) {
        this.inventoryItemService = inventoryItemService;
    }

    /**
     * Gets single inventory item by ID.
     *
     * @param id unique item identifier
     * @return inventory item details
     * @throws ResponseStatusException 404 if item not found
     */
    @GetMapping("/{id}")
    public InventoryItemDTO getById(@PathVariable String id) {
        return inventoryItemService.getById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    /**
     * Gets all inventory items (non-paginated).
     *
     * @return list of all inventory items
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping
    public List<InventoryItemDTO> getAll() {
        return inventoryItemService.getAll();
    }

    /**
     * Gets total count of inventory items.
     *
     * @return total number of items
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/count")
    public long countItems() {
        return inventoryItemService.countItems();
    }


    /**
     * Searches items by name with pagination and sorting.
     *
     * @param name     case-insensitive name substring
     * @param pageable pagination and sorting parameters
     * @return page of matching items
     */
    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping("/search")
    public Page<InventoryItemDTO> search(
        @RequestParam String name,
        @org.springframework.data.web.PageableDefault(size = 20, sort = "price") Pageable pageable) {
        return inventoryItemService.findByNameSortedByPrice(name, pageable);
    }

    /**
     * Creates new inventory item (ADMIN only).
     *
     * <p><b>Authorization</b>:
     * - Requires ROLE_ADMIN and non-demo mode (read-write access)
     * - Demo users receive 403 Forbidden with demo mode message</p>
     *
     * @param body item data (ID must be absent)
     * @return 201 Created with Location header and created item
     * @throws ResponseStatusException 400/409 on validation/duplicate errors
     * @throws ResponseStatusException 403 if user is in demo mode
     */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @PostMapping
    public ResponseEntity<InventoryItemDTO> create(
            @Validated(InventoryItemDTO.Create.class) @RequestBody InventoryItemDTO body) {

        InventoryItemDTO created = inventoryItemService.save(body);
        if (created == null) {
            return ResponseEntity.badRequest().build();
        }
        
        // REST Location Header Pattern
        // Generate Location header pointing to the newly created resource
        // Follows RFC 7231 standard for 201 Created responses
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /**
     * Updates existing inventory item completely (full replacement).
     *
     * <p><b>Authorization</b>:
     * - Requires ROLE_ADMIN and non-demo mode (read-write access)
     * - Demo users receive 403 Forbidden with demo mode message</p>
     *
     * <p><b>Semantics</b>: PUT replaces entire item (id must match path parameter)</p>
     *
     * @param id   path identifier
     * @param body updated item data (id in body is ignored for consistency)
     * @return updated inventory item
     * @throws ResponseStatusException 404 if item not found
     * @throws ResponseStatusException 403 if user is in demo mode
    */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @PutMapping("/{id}")
    public InventoryItemDTO update(
            @PathVariable String id,
            @Validated /* or @Valid */ @RequestBody InventoryItemDTO body) {

        // ID Consistency Strategy
        // Ignore client-sent body.id to prevent conflicts and match test expectations
        // Path parameter takes precedence for resource identification
        body.setId(null); // or body.setId(id) if you prefer

        return inventoryItemService.update(id, body)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    /**
     * Delete inventory item (ADMIN only).
     *
     * <p><b>Authorization</b>:
     * - Requires ROLE_ADMIN and non-demo mode (read-write access)
     * - Demo users receive 403 Forbidden with demo mode message</p>
     *
     * <p><b>Audit Trail</b>: Deletion reason is captured for compliance and troubleshooting</p>
     *
     * @param id     item identifier
     * @param reason business reason for deletion (StockChangeReason enum)
     * @return 204 No Content on success
     * @throws ResponseStatusException 404 if item not found
     * @throws ResponseStatusException 403 if user is in demo mode
    */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @RequestParam StockChangeReason reason) {
        inventoryItemService.delete(id, reason);
    }

    /**
     * Adjusts item quantity by delta amount (partial update).
     *
     * <p><b>Authorization</b>:
     * - Requires ROLE_USER or ROLE_ADMIN and non-demo mode (read-write access)
     * - Demo users receive 403 Forbidden with demo mode message</p>
     *
     * <p><b>Business Rules</b>:
     * - Delta can be positive (receive stock) or negative (consume/return stock)
     * - Reason is recorded for audit trail and compliance
     * - Stock balance can go negative (backorder support)</p>
     *
     * @param id     item identifier
     * @param delta  quantity change (positive=add, negative=remove)
     * @param reason business reason for stock change (StockChangeReason enum)
     * @return updated inventory item with new quantity
     * @throws ResponseStatusException 404 if item not found
     * @throws ResponseStatusException 403 if user is in demo mode
    */
    @PreAuthorize("hasAnyRole('USER','ADMIN') and !@securityService.isDemo()")
    @PatchMapping("/{id}/quantity")
    public InventoryItemDTO adjustQuantity(@PathVariable String id,
                                       @RequestParam int delta,
                                       @RequestParam StockChangeReason reason) {
        return inventoryItemService.adjustQuantity(id, delta, reason);
    }

    /**
     * Updates item unit price (partial update).
     *
     * <p><b>Authorization</b>:
     * - Requires ROLE_USER or ROLE_ADMIN and non-demo mode (read-write access)
     * - Demo users receive 403 Forbidden with demo mode message</p>
     *
     * <p><b>Business Rules</b>:
     * - Price must be positive (validated via @Positive constraint)
     * - Previous prices are not retained (no price history in this version)
     * - Price changes immediately affect all future calculations and reports</p>
     *
     * @param id    item identifier
     * @param price new unit price (must be positive, e.g., 19.99)
     * @return updated inventory item with new price
     * @throws ResponseStatusException 404 if item not found
     * @throws ResponseStatusException 403 if user is in demo mode
     * @throws ResponseStatusException 400 if price is not positive
    */
    @PreAuthorize("hasAnyRole('USER','ADMIN') and !@securityService.isDemo()")
    @PatchMapping("/{id}/price")
    public InventoryItemDTO updatePrice(@PathVariable String id,
                                    @RequestParam @jakarta.validation.constraints.Positive BigDecimal price) {
        return inventoryItemService.updatePrice(id, price);
    }

    /**
     * Renames an inventory item (changes the item name only).
     *
     * <p><b>Authorization</b>:
     * - Requires ROLE_ADMIN and non-demo mode (read-write access)
     * - Demo users receive 403 Forbidden with demo mode message</p>
     *
     * <p><b>Business Rules</b>:
     * - Name must be unique per supplier (prevents duplicate SKU issues)
     * - Name change is immediately visible in all reports and search results
     * - Rename does not affect stock balance or price</p>
     *
     * @param id   item identifier
     * @param name new item name (must not be empty or whitespace-only)
     * @return updated inventory item with new name
     * @throws ResponseStatusException 400 if name is empty or blank
     * @throws ResponseStatusException 404 if item not found
     * @throws ResponseStatusException 409 if name already exists for the same supplier
     * @throws ResponseStatusException 403 if user is in demo mode
     */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @PatchMapping("/{id}/name")
    public InventoryItemDTO renameItem(@PathVariable String id,
                                       @RequestParam String name) {
        try {
            return inventoryItemService.renameItem(id, name);
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if (message != null && message.contains("empty")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
            } else if (message != null && message.contains("already exists")) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, message);
            } else {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, message);
            }
        }
    }

}
