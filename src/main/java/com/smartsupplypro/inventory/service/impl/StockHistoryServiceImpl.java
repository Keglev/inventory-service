package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
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

    /**
     * Returns a new primary key for a history row.
     *
     * <p>Random, not time-based: one request can log several changes in the
     * same millisecond (an update logs price and quantity back to back), and
     * a key built from item id and clock millis made the second save merge
     * into the first row instead of inserting a new one.</p>
     */
    private static String newHistoryId() {
        return UUID.randomUUID().toString();
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

        // A null reason fails validate(); the price snapshot enables WAC and PRICE_CHANGE tracking
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .itemId(itemId)
                .change(change)
                .reason(reason == null ? null : reason.name())
                .createdBy(createdBy)
                .priceAtChange(priceAtChange)
                .build();

        StockHistoryValidator.validate(dto);

        String supplierId = resolveSupplierId(itemId);

        // Server-authoritative timestamp ensures consistency across distributed writes
        StockHistory history = StockHistory.builder()
                .id(newHistoryId())
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
}
