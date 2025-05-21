package com.smartsupplypro.inventory.service;

import java.time.LocalDate;
import java.util.List;

import com.smartsupplypro.inventory.dto.StockValueOverTimeDTO;

public interface AnalyticsService {
    List<StockValueOverTimeDTO> getTotalStockValueOverTime(LocalDate startDate, LocalDate endDate);
}
