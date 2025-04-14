package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockHistoryRepository extends JpaRepository<StockHistory, String> {
    List<StockHistory> findByItemId(String itemId);
    List<StockHistory> findByReason(StockChangeReason reason);
}