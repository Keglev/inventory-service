package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.custom.StockHistoryCustomRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for managing {@link StockHistory} entities.
 * <p>
 * Provides full audit trail access, historical reporting, and
 * advanced filtering capabilities, including support for dashboard visualizations.
 */
public interface StockHistoryRepository extends JpaRepository<StockHistory, String>, StockHistoryCustomRepository {

    /**
     * Retrieves paginated stock history entries based on optional filters:
     * date range, item name, and supplier ID.
     */
    @Query(value = """
        SELECT s.*
        FROM stock_history s
        JOIN inventory_item i ON s.item_id = i.id
        WHERE (:startDate IS NULL OR s.timestamp >= :startDate)
            AND (:endDate IS NULL OR s.timestamp <= :endDate)
            AND (:itemName IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
            AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
    """,
    countQuery = """
        SELECT COUNT(*)
        FROM stock_history s
        JOIN inventory_item i ON s.item_id = i.id
        WHERE (:startDate IS NULL OR s.timestamp >= :startDate)
            AND (:endDate IS NULL OR s.timestamp <= :endDate)
            AND (:itemName IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
            AND (:supplierId IS NULL OR i.supplier_id = :supplierId)
    """,
    nativeQuery = true)
    Page<StockHistory> findFiltered(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("itemName") String itemName,
        @Param("supplierId") String supplierId,
        Pageable pageable
    );


    /**
     * Finds all stock history records for a given inventory item.
     */
    List<StockHistory> findByItemId(String itemId);

    /**
     * Finds stock history records by reason code.
     */
    List<StockHistory> findByReason(StockChangeReason reason);

    /**
     * Returns price trend for a specific item within a time range.
     */
    @Query("""
        SELECT new com.smartsupplypro.inventory.dto.PriceTrendDTO(sh.timestamp, sh.priceAtChange)
        FROM StockHistory sh
        WHERE sh.itemId = :itemId
            AND sh.timestamp BETWEEN :start AND :end
            AND sh.priceAtChange IS NOT NULL
            ORDER BY sh.timestamp
        """)
    List<PriceTrendDTO> getPriceTrend(
        @Param("itemId") String itemId,
        @Param("start") LocalDateTime start,
        @Param("end") LocalDateTime end
    );

}

/**
 * This repository interface provides methods for querying stock history data
 * with advanced filtering and aggregation capabilities, suitable for reporting
 * and dashboard visualizations.
 * <p>
 * Complex native queries (Oracle/H2 specific) have been offloaded to
 * {@link StockHistoryCustomRepositoryImpl} to ensure cross-database compatibility.
 */
