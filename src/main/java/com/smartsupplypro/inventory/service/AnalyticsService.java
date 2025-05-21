package com.smartsupplypro.inventory.service;

import java.time.LocalDate;
import java.util.List;

import com.smartsupplypro.inventory.dto.ItemUpdateFrequencyDTO;
import com.smartsupplypro.inventory.dto.LowStockItemDTO;
import com.smartsupplypro.inventory.dto.MonthlyStockMovementDTO;
import com.smartsupplypro.inventory.dto.StockPerSupplierDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;

public interface AnalyticsService {
    List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate, LocalDate endDate, String supplierId);
    List<StockPerSupplierDTO> getTotalStockPerSupplier();
    List<ItemUpdateFrequencyDTO> getItemUpdateFrequency(String supplierId);
    List<LowStockItemDTO> getItemsBelowMinimumStock(String supplierId);
    List<MonthlyStockMovementDTO> getMonthlyStockMovement(LocalDate startDate, LocalDate endDate, String supplierId);
    List<StockUpdateResultDTO> getFilteredStockUpdates(StockUpdateFilterDTO filter);
}
