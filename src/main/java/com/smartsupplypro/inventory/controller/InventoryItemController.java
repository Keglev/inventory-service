package com.smartsupplypro.inventory.controller;

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
import com.smartsupplypro.inventory.service.InventoryItemService;

/**
 * REST controller for inventory item CRUD operations.
 *
 * <p>Read endpoints allow authentication or demo-readonly access.
 * Write operations require {@code ROLE_ADMIN} and a non-demo session.</p>
 *
 * @see InventoryItemService
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
     * Gets a single inventory item by ID.
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

    @PreAuthorize("isAuthenticated() or @appProperties.demoReadonly")
    @GetMapping
    public List<InventoryItemDTO> getAll() {
        return inventoryItemService.getAll();
    }

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
     * Creates a new inventory item.
     *
     * @param body item data (ID must be absent)
     * @return 201 Created with Location header and created item
     * @throws ResponseStatusException 400 if validation fails
     */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
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

    /**
     * Replaces an existing inventory item.
     *
     * @param id   path identifier
     * @param body updated item data
     * @return updated inventory item
     * @throws ResponseStatusException 404 if item not found
     */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @PutMapping("/{id}")
    public InventoryItemDTO update(
            @PathVariable String id,
            @Validated @RequestBody InventoryItemDTO body) {

        body.setId(null); // path id takes precedence; avoids conflicts in update logic
        return inventoryItemService.update(id, body)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));
    }

    /**
     * Deletes an inventory item. Deletion is only permitted once the item's
     * quantity is zero; in-stock merchandise must first be reduced via a
     * quantity adjustment, which is where the stock movement is audited.
     *
     * @param id item identifier
     * @throws ResponseStatusException 404 if item not found
     */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        inventoryItemService.delete(id);
    }
}
