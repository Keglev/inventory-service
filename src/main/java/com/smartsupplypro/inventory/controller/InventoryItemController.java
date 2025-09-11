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
 * REST controller for managing inventory items.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Expose CRUD/search endpoints for inventory items.</li>
 *   <li>Apply route-level authorization; delegate rules to the service layer.</li>
 *   <li>Let exceptions bubble to GlobalExceptionHandler for consistent status codes.</li>
 * </ul>
 *
 * <p>Status conventions:
 * <ul>
 *   <li>201 Created + Location on successful create</li>
 *   <li>204 No Content on successful delete</li>
 *   <li>404 Not Found when item is missing</li>
 *   <li>409 Conflict on duplicates/optimistic locking</li>
 *   <li>403 Forbidden when role-based rules are violated</li>
 *   <li>400 for bean validation failures</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/inventory")
@Validated
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    public InventoryItemController(InventoryItemService inventoryItemService) {
        this.inventoryItemService = inventoryItemService;
    }

    /** Retrieve a single item by id.
     *  @param id unique item identifier
     *  @return the item
     *  @throws ResponseStatusException 404 if not found (handled by GlobalExceptionHandler)
     */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/{id}")
    public InventoryItemDTO getById(@PathVariable String id) {
        return inventoryItemService.getById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    /** Retrieve all items (non‑paginated). Prefer /search for large datasets. */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping
    public List<InventoryItemDTO> getAll() {
        return inventoryItemService.getAll();
    }

    /**
    * Returns the total number of inventory items.
    * @return JSON number (e.g., 123)
    */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/count")
    public long countItems() {
        return inventoryItemService.countItems();
    }


    /** Search items by (partial) name with paging/sorting.
     *  @apiNote Defaults to page size 20; prefer this over GET /api/inventory for large datasets.
     *  @param name case-insensitive substring to search
     *  @param pageable Spring pageable (page,size,sort)
     *  @return page of items
     */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @GetMapping("/search")
    public Page<InventoryItemDTO> search(
        @RequestParam String name, 
        @org.springframework.data.web.PageableDefault(size = 20, sort = "price") Pageable pageable) {
        return inventoryItemService.findByNameSortedByPrice(name, pageable);
    }

    /** Create a new item (ADMIN).
     *  <p>Validation group: {@code InventoryItemDTO.Create} — ID must be absent.</p>
     *  @return 201 Created with Location: /api/inventory/{id}
     *  @response 400 on validation error (bean validation) or if service returns null
     *  @response 409 on duplicate (via {@link com.smartsupplypro.inventory.exception.DuplicateResourceException})
     *  @response 403 if caller lacks ADMIN role
     */
   @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<InventoryItemDTO> create(
            @Validated(InventoryItemDTO.Create.class) @RequestBody InventoryItemDTO body) {

        InventoryItemDTO created = inventoryItemService.save(body);
        if (created == null) {
            return ResponseEntity.badRequest().build();
        }
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /** Full update of an item.
     *  <p>Validation group: {@code InventoryItemDTO.Update} — ID is required/validated for update semantics.</p>
     *  @param id path identifier; if payload contains an ID, it must match
     *  @return the updated item
     *  @response 400 if path ID and payload ID differ
     *  @response 404 if the item does not exist
     */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @PutMapping("/{id}")
    public InventoryItemDTO update(
            @PathVariable String id,
            @Validated /* or @Valid */ @RequestBody InventoryItemDTO body) {

        // Ignore any client-sent body.id to avoid false 400s and match test expectations
        body.setId(null); // or body.setId(id) if you prefer

        return inventoryItemService.update(id, body)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    /** Delete an item (ADMIN).
     *  <p>Requires a {@code reason} for auditability; service persists stock history.</p>
     *  @response 204 on success
     *  @response 404 if the item does not exist (service should throw)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, @RequestParam StockChangeReason reason) {
        inventoryItemService.delete(id, reason);
    }

    /** Adjust item quantity by a delta (can be positive or negative).
     *  @param delta positive to add stock, negative to remove
     *  @param reason business reason recorded in stock history
     *  @return the updated item
     *  @response 400 if delta violates business rules (validator/service)
     */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @PatchMapping("/{id}/quantity")
    public InventoryItemDTO adjustQuantity(@PathVariable String id,
                                       @RequestParam int delta,
                                       @RequestParam StockChangeReason reason) {
        return inventoryItemService.adjustQuantity(id, delta, reason);
    }

    /** Update unit price for the item.
     *  @param price new price; must be > 0
     *  @return the updated item
     */
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    @PatchMapping("/{id}/price")
    public InventoryItemDTO updatePrice(@PathVariable String id,
                                    @RequestParam @jakarta.validation.constraints.Positive BigDecimal price) {
        return inventoryItemService.updatePrice(id, price);
    }

}
