package com.smartsupplypro.inventory.validation;

import java.util.EnumSet;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;


public class StockHistoryValidator {
    private StockHistoryValidator() {}

    public static void validate(StockHistoryDTO dto) {
        if (dto.getItemId() == null || dto.getItemId().trim().isEmpty()) {
            throw new IllegalArgumentException("Item ID cannot be null or empty");
        }
        if (dto.getChange() == 0) {
            throw new IllegalArgumentException("Change amount must be non-zero");
        }
        if (dto.getReason() == null || dto.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Change reason is required");
        }
        try {
            StockChangeReason.valueOf(dto.getReason());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unsupported change reason: " + dto.getReason());
        }
        if (dto.getCreatedBy() == null || dto.getCreatedBy().trim().isEmpty()) {
            throw new IllegalArgumentException("CreatedBy is required");
        }
    }

    public static void validateEnum(StockChangeReason reason) {
        if (reason == null || !EnumSet.of(
                StockChangeReason.SOLD,
                StockChangeReason.SCRAPPED,
                StockChangeReason.RETURNED_TO_SUPPLIER,
                StockChangeReason.RETURNED_BY_CUSTOMER,
                StockChangeReason.INITIAL_STOCK,
                StockChangeReason.MANUAL_UPDATE
        ).contains(reason)) {
            throw new IllegalArgumentException("Invalid stock change reason: " + reason);
        }
    }
}