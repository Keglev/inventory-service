package com.smartsupplypro.inventory.controller;

import java.math.BigDecimal;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.service.InventoryItemService;

import jakarta.validation.constraints.Positive;

/**
 * REST controller for partial inventory item updates (quantity, price, name).
 *
 * <p>Quantity and price adjustments require {@code ROLE_USER} or {@code ROLE_ADMIN}.
 * Rename requires {@code ROLE_ADMIN}.</p>
 *
 * @see InventoryItemService
 */
@RestController
@RequestMapping("/api/inventory")
@Validated
public class InventoryItemPatchController {

    private final InventoryItemService inventoryItemService;

    public InventoryItemPatchController(InventoryItemService inventoryItemService) {
        this.inventoryItemService = inventoryItemService;
    }

    /**
     * Adjusts item quantity by a signed delta.
     *
     * @param id     item identifier
     * @param delta  quantity change (positive = receive, negative = consume/return)
     * @param reason business reason for the stock change
     * @return updated inventory item
     */
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @PatchMapping("/{id}/quantity")
    public InventoryItemDTO adjustQuantity(@PathVariable String id,
                                           @RequestParam int delta,
                                           @RequestParam StockChangeReason reason) {
        return inventoryItemService.adjustQuantity(id, delta, reason);
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    @PatchMapping("/{id}/price")
    public InventoryItemDTO updatePrice(@PathVariable String id,
                                        @RequestParam @Positive BigDecimal price) {
        return inventoryItemService.updatePrice(id, price);
    }

    /**
     * Renames an inventory item.
     *
     * @param id   item identifier
     * @param name new item name
     * @return updated item with new name
     * @throws InvalidRequestException             400 if the name is blank
     * @throws java.util.NoSuchElementException     404 if the item does not exist
     * @throws DuplicateResourceException           409 if the name already exists for the same supplier
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/name")
    public InventoryItemDTO renameItem(@PathVariable String id, @RequestParam String name) {
        return inventoryItemService.renameItem(id, name);
    }
}
