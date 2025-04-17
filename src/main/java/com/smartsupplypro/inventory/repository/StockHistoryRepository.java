package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDateTime;

public interface StockHistoryRepository extends JpaRepository<StockHistory, String> {

    @Query("""
        SELECT s FROM StockHistory s 
        JOIN InventoryItem i ON s.itemId = i.id
        WHERE (:startDate IS NULL OR s.timestamp >= :startDate)
          AND (:endDate IS NULL OR s.timestamp <= :endDate)
          AND (:itemName IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :itemName, '%')))
          AND (:supplierId IS NULL OR i.supplierId = :supplierId)
        """)
    Page<StockHistory> findFiltered(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("itemName") String itemName,
            @Param("supplierId") String supplierId,
            Pageable pageable
    );
    List<StockHistory> findByItemId(String itemId);
    List<StockHistory> findByReason(StockChangeReason reason);
}