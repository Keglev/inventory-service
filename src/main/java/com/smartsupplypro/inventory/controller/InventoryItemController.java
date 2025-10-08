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
    @PreAuthorize("isAuthenticated()")
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
     * @param body item data (ID must be absent)
     * @return 201 Created with Location header and created item
     * @throws ResponseStatusException 400/409 on validation/duplicate errors
     */
   @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<InventoryItemDTO> create(
            @Validated(InventoryItemDTO.Create.class) @RequestBody InventoryItemDTO body) {

        InventoryItemDTO created = inventoryItemService.save(body);
        if (created == null) {
            return ResponseEntity.badRequest().build();
        }
        
        // Enterprise Comment: REST Location Header Pattern
        // Generate Location header pointing to the newly created resource
        // Follows RFC 7231 standard for 201 Created responses
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /**
     * Updates existing inventory item completely.
     *
     * @param id   path identifier
     * @param body updated item data
     * @return updated inventory item
     * @throws ResponseStatusException 404 if item not found
     */
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    public InventoryItemDTO update(
            @PathVariable String id,
            @Validated /* or @Valid */ @RequestBody InventoryItemDTO body) {

        // Enterprise Comment: ID Consistency Strategy
        // Ignore client-sent body.id to prevent conflicts and match test expectations
        // Path parameter takes precedence for resource identification
        body.setId(null); // or body.setId(id) if you prefer

        return inventoryItemService.update(id, body)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    /**
     * Deletes inventory item (ADMIN only).
     *
     * @param id     item identifier
     * @param reason business reason for deletion (audit trail)
     * @throws ResponseStatusException 404 if item not found
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @RequestParam StockChangeReason reason) {
        inventoryItemService.delete(id, reason);
    }

    /**
     * Adjusts item quantity by delta amount.
     *
     * @param id     item identifier
     * @param delta  quantity change (positive to add, negative to remove)
     * @param reason business reason for stock change
     * @return updated inventory item
     */
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{id}/quantity")
    public InventoryItemDTO adjustQuantity(@PathVariable String id,
                                       @RequestParam int delta,
                                       @RequestParam StockChangeReason reason) {
        return inventoryItemService.adjustQuantity(id, delta, reason);
    }

    /**
     * Updates item unit price.
     *
     * @param id    item identifier
     * @param price new unit price (must be positive)
     * @return updated inventory item
     */
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{id}/price")
    public InventoryItemDTO updatePrice(@PathVariable String id,
                                    @RequestParam @jakarta.validation.constraints.Positive BigDecimal price) {
        return inventoryItemService.updatePrice(id, price);
    }

}
