package com.smartsupplypro.inventory.validation;

import java.util.EnumSet;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Stateless validation utilities for stock history operations.
 *
 * <p>Enforces required fields, enum validity, and business constraints.
 * Cannot be expressed as Bean Validation because the zero-delta rule
 * depends on the value of the {@code reason} field (cross-field logic).</p>
 *
 * @see com.smartsupplypro.inventory.service.impl.StockHistoryServiceImpl
 */
public class StockHistoryValidator {

    private StockHistoryValidator() {}

    public static void validate(StockHistoryDTO dto) {
        if (dto.itemId() == null || dto.itemId().isBlank()) {
            throw new InvalidRequestException("Item ID cannot be null or empty");
        }

        final StockChangeReason reason;
        try {
            reason = dto.reason() == null ? null : StockChangeReason.valueOf(dto.reason());
        } catch (IllegalArgumentException ex) {
            throw new InvalidRequestException("Invalid stock change reason: " + dto.reason());
        }
        if (reason == null) throw new InvalidRequestException("Stock change reason is required");

        // zero delta is only meaningful for PRICE_CHANGE, which records no stock movement
        if (dto.change() == 0 && reason != StockChangeReason.PRICE_CHANGE) {
            throw new InvalidRequestException("Zero quantity change is only allowed for PRICE_CHANGE");
        }

        if (dto.createdBy() == null || dto.createdBy().isBlank()) {
            throw new InvalidRequestException("CreatedBy must be provided");
        }

        if (reason == StockChangeReason.PRICE_CHANGE &&
                dto.priceAtChange() != null &&
                dto.priceAtChange().signum() < 0) {
            throw new InvalidRequestException("priceAtChange must be >= 0 for PRICE_CHANGE");
        }
    }

    public static void validateEnum(StockChangeReason reason) {
        if (reason == null || !EnumSet.of(
                StockChangeReason.SOLD,
                StockChangeReason.SCRAPPED,
                StockChangeReason.RETURNED_TO_SUPPLIER,
                StockChangeReason.RETURNED_BY_CUSTOMER,
                StockChangeReason.INITIAL_STOCK,
                StockChangeReason.MANUAL_UPDATE,
                StockChangeReason.PRICE_CHANGE
        ).contains(reason)) {
            throw new IllegalArgumentException("Invalid stock change reason: " + reason);
        }
    }
}
