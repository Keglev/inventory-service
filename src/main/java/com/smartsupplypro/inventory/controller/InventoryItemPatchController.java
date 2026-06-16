package com.smartsupplypro.inventory.controller;

import java.math.BigDecimal;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.service.InventoryItemService;

import jakarta.validation.constraints.Positive;

/**
 * REST controller for partial inventory item updates (quantity, price, name).
 *
 * <p>All endpoints require a non-demo session.
 * Quantity and price adjustments require {@code ROLE_USER} or {@code ROLE_ADMIN}.
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
    @PreAuthorize("hasAnyRole('USER','ADMIN') and !@securityService.isDemo()")
    @PatchMapping("/{id}/quantity")
    public InventoryItemDTO adjustQuantity(@PathVariable String id,
                                           @RequestParam int delta,
                                           @RequestParam StockChangeReason reason) {
        return inventoryItemService.adjustQuantity(id, delta, reason);
    }

    @PreAuthorize("hasAnyRole('USER','ADMIN') and !@securityService.isDemo()")
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
     * @throws ResponseStatusException 400 if name is blank, 404 if not found,
     *                                 409 if name already exists for the same supplier
     */
    @PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
    @PatchMapping("/{id}/name")
    public InventoryItemDTO renameItem(@PathVariable String id, @RequestParam String name) {
        try {
            return inventoryItemService.renameItem(id, name);
        } catch (IllegalArgumentException e) {
            throw toResponseStatusException(e);
        }
    }

    // Service throws IllegalArgumentException with embedded message tokens; translate to HTTP status codes
    private ResponseStatusException toResponseStatusException(IllegalArgumentException e) {
        String message = e.getMessage();
        if (message != null && message.contains("empty")) {
            return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        } else if (message != null && message.contains("already exists")) {
            return new ResponseStatusException(HttpStatus.CONFLICT, message);
        }
        return new ResponseStatusException(HttpStatus.NOT_FOUND, message);
    }
}
