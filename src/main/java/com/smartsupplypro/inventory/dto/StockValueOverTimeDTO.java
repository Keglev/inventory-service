package com.smartsupplypro.inventory.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StockValueOverTimeDTO {
     private LocalDate date;
    private double totalValue;
}
