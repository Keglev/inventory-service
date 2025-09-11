package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.InventoryItemService;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.validation.InventoryItemSecurityValidator;
import com.smartsupplypro.inventory.validation.InventoryItemValidator;
import static com.smartsupplypro.inventory.validation.InventoryItemValidator.assertFinalQuantityNonNegative;
import static com.smartsupplypro.inventory.validation.InventoryItemValidator.assertPriceValid;

/**
 * Service layer responsible for managing inventory item operations including
 * creation, update, deletion, and retrieval. Also coordinates stock history logging
 * and supplier validation.
 *
 * <p>Responsibilities:</p>
 * <ul>
 *   <li>Validate inputs and permissions</li>
 *   <li>Map between entities and DTOs</li>
 *   <li>Persist changes and write stock history (quantity + price snapshots)</li>
 *   <li>Enforce domain rules (e.g., allowed deletion reasons)</li>
 * </ul>
 */
@Service
public class InventoryItemServiceImpl implements InventoryItemService {

    private final InventoryItemRepository repository;
    private final StockHistoryService stockHistoryService;
    private final SupplierRepository supplierRepository;

    /**
     * Constructs the InventoryItemService with required dependencies.
     */
    public InventoryItemServiceImpl(
            InventoryItemRepository repository,
            StockHistoryService stockHistoryService,
            SupplierRepository supplierRepository
    ) {
        this.repository = repository;
        this.stockHistoryService = stockHistoryService;
        this.supplierRepository = supplierRepository;
    }

    /** {@inheritDoc} */
    @Override
    public List<InventoryItemDTO> getAll() {
        return repository.findAll()
                .stream()
                .map(InventoryItemMapper::toDTO)
                .toList();
    }

    /** {@inheritDoc} */
    @Override
    public Optional<InventoryItemDTO> getById(String id) {
        return repository.findById(id).map(InventoryItemMapper::toDTO);
    }

    /** {@inheritDoc} */
    @Override
    public Page<InventoryItemDTO> findByNameSortedByPrice(String name, Pageable pageable) {
        Page<InventoryItem> page = repository.findByNameSortedByPrice(name, pageable);
        return page == null ? Page.empty() : page.map(InventoryItemMapper::toDTO);
    }

    /**
    * Total number of inventory items (KPI).
    */
    @Override
    @Transactional(readOnly = true)
    public long countItems() {
        return repository.count();
    }

    /**
     * Persists a new inventory item after validating input data and logging its initial stock.
     * Also records a stock history entry with the initial quantity and current unit price snapshot.
     */
    @Override
    public InventoryItemDTO save(InventoryItemDTO dto) {
        InventoryItemValidator.validateBase(dto);
        InventoryItemValidator.validateInventoryItemNotExists(dto.getName(), dto.getPrice(), repository);
        validateSupplierExists(dto.getSupplierId());

        InventoryItem entity = InventoryItemMapper.toEntity(dto);

        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }
        if (entity.getMinimumQuantity() <= 0) {
            entity.setMinimumQuantity(10); // sensible default
        }

        InventoryItem saved = repository.save(entity);

        // Write INITIAL_STOCK with quantity and price snapshot
        stockHistoryService.logStockChange(
                saved.getId(),
                saved.getQuantity(),
                StockChangeReason.INITIAL_STOCK,
                actorUsername(saved.getCreatedBy()),
                saved.getPrice() // priceAtChange snapshot
        );

        return InventoryItemMapper.toDTO(saved);
    }

    /**
     * Updates an existing inventory item.
     * <ul>
     *   <li>Validates permissions</li>
     *   <li>Writes a MANUAL_UPDATE history entry when quantity changes (with price snapshot)</li>
     * </ul>
     */
    @Override
    public Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto) {
        InventoryItemValidator.validateBase(dto);
        validateSupplierExists(dto.getSupplierId());

        InventoryItem existing = InventoryItemValidator.validateExists(id, repository);

        // Enforce role-based rules (e.g., only admin can update name/supplier)
        InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);

        boolean nameChanged = !existing.getName().equalsIgnoreCase(dto.getName());
        boolean priceChanged = !existing.getPrice().equals(dto.getPrice());
        if (nameChanged || priceChanged) {
            InventoryItemValidator.validateInventoryItemNotExists(id, dto.getName(), dto.getPrice(), repository);
        }

        int quantityDiff = dto.getQuantity() - existing.getQuantity();

        existing.setName(dto.getName());
        existing.setQuantity(dto.getQuantity());
        if (priceChanged) {
            assertPriceValid(dto.getPrice());
            existing.setPrice(dto.getPrice());
        }
        existing.setSupplierId(dto.getSupplierId());
        existing.setCreatedBy(dto.getCreatedBy());

        InventoryItem updated = repository.save(existing);

        // Log quantity movement (if any) with current price snapshot
        if (quantityDiff != 0) {
            stockHistoryService.logStockChange(
                    updated.getId(),
                    quantityDiff,
                    StockChangeReason.MANUAL_UPDATE,
                    actorUsername(updated.getCreatedBy()),
                    updated.getPrice()
            );
        }

        return Optional.of(InventoryItemMapper.toDTO(updated));
    }

    /**
     * Deletes an item. Logs a full negative adjustment before deletion.
     * Allowed reasons: SCRAPPED, DESTROYED, DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER.
     */
    @Override
    public void delete(String id, StockChangeReason reason) {
        if (reason != StockChangeReason.SCRAPPED &&
            reason != StockChangeReason.DESTROYED &&
            reason != StockChangeReason.DAMAGED &&
            reason != StockChangeReason.EXPIRED &&
            reason != StockChangeReason.LOST &&
            reason != StockChangeReason.RETURNED_TO_SUPPLIER) {
            throw new IllegalArgumentException("Invalid reason for deletion");
        }

        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));

        // Log full removal (negative) with price snapshot, then delete
        stockHistoryService.logStockChange(
                item.getId(),
                -item.getQuantity(),
                reason,
                actorUsername(item.getCreatedBy()),
                item.getPrice()
        );

        repository.deleteById(id);
    }

    /**
     * Adjusts quantity by delta (positive or negative). Writes a history entry with price snapshot.
     */
    @Override
    public InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason) {
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));

        int newQty = item.getQuantity() + delta;
        assertFinalQuantityNonNegative(newQty);

        item.setQuantity(newQty);
        InventoryItem saved = repository.save(item);

        stockHistoryService.logStockChange(
                saved.getId(),
                delta,
                reason,
                actorUsername(saved.getCreatedBy()),
                saved.getPrice()
        );

        return InventoryItemMapper.toDTO(saved);
    }

    /**
     * Updates unit price and writes a PRICE_CHANGE history entry with change=0 and price snapshot.
     */
    @Override
    public InventoryItemDTO updatePrice(String id, BigDecimal newPrice) {
        assertPriceValid(newPrice);

        InventoryItem item = loadOrThrow(id);
        item.setPrice(newPrice);
        InventoryItem saved = repository.save(item);

        stockHistoryService.logStockChange(
                id,
                0, // zero quantity for price events
                StockChangeReason.PRICE_CHANGE,
                currentUsername(),
                newPrice
        );

        return InventoryItemMapper.toDTO(saved);
    }

    /* ---------- helpers ---------- */

    private void validateSupplierExists(String supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new IllegalArgumentException("Supplier does not exist");
        }
    }

    private InventoryItem loadOrThrow(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
    }

    /**
     * Prefer a non-null, meaningful actor for audit trails:
     * - If the entity has 'createdBy', use it; otherwise fall back to the security principal.
     */
    private String actorUsername(String createdBy) {
        return (createdBy != null && !createdBy.isBlank()) ? createdBy : currentUsername();
    }

    private String currentUsername() {
        Authentication a = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication() : null;
        return a != null ? a.getName() : "system";
    }
}
