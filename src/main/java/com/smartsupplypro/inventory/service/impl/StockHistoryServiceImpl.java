package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.StockHistoryMapper;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.validation.StockHistoryValidator;

import lombok.RequiredArgsConstructor;

/**
 * Default implementation of {@link StockHistoryService} using Spring Data JPA.
 *
 * <p>Denormalizes supplier ID onto each history record so analytics queries
 * can filter by supplier without joining back to inventory_item.</p>
 *
 * @see StockHistoryService
 * @see StockHistoryValidator
 * @see StockHistoryMapper
 */
@Service
@RequiredArgsConstructor
public class StockHistoryServiceImpl implements StockHistoryService {

    private final StockHistoryRepository repository;
    private final InventoryItemRepository itemRepository;
    private final StockHistoryMapper mapper;

    /**
     * Resolves the supplier ID for denormalization on stock history records.
     * Stored on the history row to avoid joins in analytics queries.
     */
    private String resolveSupplierId(String itemId) {
        return itemRepository.findById(itemId)
                .map(item -> item.getSupplierId())
                .orElse(null);
    }

    /** {@inheritDoc} */
    @Override
    public List<StockHistoryDTO> getAll() {
        return repository.findAll().stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    /** {@inheritDoc} */
    @Override
    public List<StockHistoryDTO> getByItemId(String itemId) {
        return repository.findByItemIdOrderByTimestampDesc(itemId)
                .stream().map(mapper::toDTO).toList();
    }

    /** {@inheritDoc} */
    @Override
    public List<StockHistoryDTO> getByReason(StockChangeReason reason) {
        return repository.findByReasonOrderByTimestampDesc(reason)
                .stream().map(mapper::toDTO).toList();
    }

    /** {@inheritDoc} */
    @Override
    public Page<StockHistoryDTO> findFiltered(LocalDateTime startDate,
                                              LocalDateTime endDate,
                                              String itemName,
                                              String supplierId,
                                              Pageable pageable) {
        return repository.findFiltered(startDate, endDate, itemName, supplierId, pageable)
                .map(mapper::toDTO);
    }

    /** {@inheritDoc} */
    @Override
    public void logStockChange(String itemId, int change, StockChangeReason reason, String createdBy) {
        logStockChange(itemId, change, reason, createdBy, null);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Builds a DTO for domain validation, then persists an immutable
     * {@link StockHistory} entity with a server-authoritative timestamp.</p>
     */
    @Override
    public void logStockChange(String itemId,
                               int change,
                               StockChangeReason reason,
                               String createdBy,
                               BigDecimal priceAtChange) {

        StockHistoryValidator.validateEnum(reason);

        // Build DTO for domain validation; price snapshot enables WAC and PRICE_CHANGE tracking
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .itemId(itemId)
                .change(change)
                .reason(reason.name())
                .createdBy(createdBy)
                .priceAtChange(priceAtChange)
                .build();

        StockHistoryValidator.validate(dto);

        String supplierId = resolveSupplierId(itemId);

        // Server-authoritative timestamp ensures consistency across distributed writes
        StockHistory history = StockHistory.builder()
                .id("sh-" + itemId + "-" + System.currentTimeMillis())
                .itemId(itemId)
                .supplierId(supplierId)
                .change(change)
                .reason(reason)
                .createdBy(createdBy)
                .timestamp(LocalDateTime.now())
                .priceAtChange(priceAtChange)
                .build();

        repository.save(history);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Applies domain validation, enriches the record with the denormalized
     * supplierId, and uses a server-authoritative timestamp for audit consistency.</p>
     */
    @Override
    public void save(StockHistoryDTO dto) {
        StockHistoryValidator.validate(dto);

        String supplierId = resolveSupplierId(dto.itemId());

        StockHistory history = StockHistory.builder()
                .id("sh-" + dto.itemId() + "-" + System.currentTimeMillis())
                .itemId(dto.itemId())
                .supplierId(supplierId)
                .change(dto.change())
                .reason(StockChangeReason.valueOf(dto.reason()))
                .createdBy(dto.createdBy())
                .timestamp(LocalDateTime.now())
                .priceAtChange(dto.priceAtChange())
                .build();

        repository.save(history);
    }

    /** {@inheritDoc} */
    @Override
    public void delete(String itemId, StockChangeReason reason, String createdBy) {
        logStockChange(itemId, -1, reason, createdBy);
    }
}
