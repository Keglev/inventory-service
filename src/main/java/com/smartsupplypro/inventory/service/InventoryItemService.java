package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * High-level business operations for inventory items.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Expose create/update/delete/search operations to controllers.</li>
 *   <li>Enforce domain rules and orchestrate stock history logging.</li>
 *   <li>Keep persistence details encapsulated in the implementation.</li>
 * </ul>
 */
public interface InventoryItemService {

    /** @return all items (use paged methods for large datasets). */
    List<InventoryItemDTO> getAll();

    /** @return item by id or empty if not found. */
    Optional<InventoryItemDTO> getById(String id);

    /**
     * Finds items by (partial) name with paging, sorted by ascending price.
     */
    Page<InventoryItemDTO> findByNameSortedByPrice(String name, Pageable pageable);

    /** Create a new item. */
    InventoryItemDTO save(InventoryItemDTO dto);

    /** Full update of an existing item. */
    Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto);

    /** Delete an item, recording the business reason in stock history. */
    void delete(String id, StockChangeReason reason);

    /**
     * Adjust quantity by a delta (positive or negative) and log a stock history entry.
     * Implementations should record the current unit price as {@code priceAtChange}.
     */
    InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason);

    /**
     * Update unit price and also log a PRICE_CHANGE stock history entry
     * with {@code change = 0} and {@code priceAtChange = newPrice}.
     */
    InventoryItemDTO updatePrice(String id, BigDecimal newPrice);
}
