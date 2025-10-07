package com.smartsupplypro.inventory.validation;

import java.util.EnumSet;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Validation utilities for stock history operations.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>DTO Validation</strong>: Item ID, change value, reason, audit fields</li>
 *   <li><strong>Enum Validation</strong>: Stock change reason whitelist enforcement</li>
 *   <li><strong>Business Rules</strong>: Zero-delta only for PRICE_CHANGE, non-negative prices</li>
 *   <li><strong>Audit Trail</strong>: Mandatory createdBy field enforcement</li>
 * </ul>
 *
 * @see StockHistoryService
 * @see <a href="file:../../../../../../docs/architecture/patterns/validation-patterns.md">Validation Patterns</a>
 */
public class StockHistoryValidator {

    private StockHistoryValidator() {}

    /**
     * Validates stock history DTO before persistence.
     * Enforces item ID, non-zero change (except PRICE_CHANGE), valid reason, and audit fields.
     *
     * @param dto stock change data
     * @throws InvalidRequestException if validation fails
     */
    public static void validate(StockHistoryDTO dto) {
    if (dto.getItemId() == null || dto.getItemId().isBlank()) {
      throw new InvalidRequestException("Item ID cannot be null or empty");
    }

    final StockChangeReason reason;
    try {
      reason = dto.getReason() == null ? null : StockChangeReason.valueOf(dto.getReason());
    } catch (IllegalArgumentException ex) {
      throw new InvalidRequestException("Invalid stock change reason: " + dto.getReason());
    }
    if (reason == null) throw new InvalidRequestException("Stock change reason is required");

    // zero delta only for PRICE_CHANGE
    if (dto.getChange() == 0 && reason != StockChangeReason.PRICE_CHANGE) {
      throw new InvalidRequestException("Zero quantity change is only allowed for PRICE_CHANGE");
    }

    // enforce createdBy is provided  ***
    if (dto.getCreatedBy() == null || dto.getCreatedBy().isBlank()) {
        throw new InvalidRequestException("CreatedBy must be provided");
    }

    // optional: non-negative price for PRICE_CHANGE
    if (reason == StockChangeReason.PRICE_CHANGE &&
        dto.getPriceAtChange() != null &&
        dto.getPriceAtChange().signum() < 0) {
      throw new InvalidRequestException("priceAtChange must be >= 0 for PRICE_CHANGE");
    }
  }

    /**
     * Validates stock change reason is in allowed enum set.
     *
     * @param reason stock change reason
     * @throws IllegalArgumentException if reason is null or not allowed
     */
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
// This code provides the StockHistoryValidator class, which enforces validation rules for stock history data.