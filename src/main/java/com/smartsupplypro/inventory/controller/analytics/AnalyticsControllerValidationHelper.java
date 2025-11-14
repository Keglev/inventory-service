package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Validation helper for analytics controller request parameters.
 *
 * <p>Centralizes validation logic for:
 * <ul>
 *   <li>Date range validation (start ≤ end)</li>
 *   <li>Non-blank string parameters</li>
 *   <li>Filter DTO validation (date ranges, numeric ranges)</li>
 *   <li>Default date window application (last 30 days)</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
@Component
public class AnalyticsControllerValidationHelper {

    /**
     * Validates LocalDate range parameters.
     *
     * @param start start date (must not be null)
     * @param end end date (must not be null and >= start)
     * @param startName parameter name for error messages
     * @param endName parameter name for error messages
     * @throws InvalidRequestException if validation fails
     */
    public void validateDateRange(LocalDate start, LocalDate end, String startName, String endName) {
        if (start == null || end == null) {
            throw new InvalidRequestException(startName + " and " + endName + " are required");
        }
        if (start.isAfter(end)) {
            throw new InvalidRequestException(startName + " must be on or before " + endName);
        }
    }

    /**
     * Validates LocalDateTime range parameters.
     *
     * @param start start datetime
     * @param end end datetime
     * @param startName parameter name for error messages
     * @param endName parameter name for error messages
     * @throws InvalidRequestException if start > end
     */
    public void validateDateTimeRange(LocalDateTime start, LocalDateTime end, String startName, String endName) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new InvalidRequestException(startName + " must be on or before " + endName);
        }
    }

    /**
     * Validates string parameter is not blank.
     *
     * @param value parameter value to check
     * @param name parameter name for error messages
     * @throws InvalidRequestException if value is blank
     */
    public void requireNonBlank(String value, String name) {
        if (value == null || value.trim().isEmpty()) {
            throw new InvalidRequestException(name + " must not be blank");
        }
    }

    /**
     * Validates numeric range parameters.
     *
     * @param min minimum value
     * @param max maximum value
     * @param minName parameter name for error messages
     * @param maxName parameter name for error messages
     * @throws InvalidRequestException if min > max
     */
    public void validateNumericRange(Integer min, Integer max, String minName, String maxName) {
        if (min != null && max != null && min > max) {
            throw new InvalidRequestException(minName + " must be <= " + maxName);
        }
    }

    /**
     * Applies default date window (last 30 days) if both dates are null.
     *
     * @param startDate current start date (nullable)
     * @param endDate current end date (nullable)
     * @return array with [startDate, endDate] with defaults applied
     */
    public LocalDateTime[] applyDefaultDateWindow(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null && endDate == null) {
            endDate = LocalDateTime.now();
            startDate = endDate.minusDays(30);
        }
        return new LocalDateTime[]{startDate, endDate};
    }

    /**
     * Validates stock update filter DTO constraints.
     *
     * @param filter the filter DTO to validate
     * @throws InvalidRequestException if validation fails
     */
    public void validateStockUpdateFilter(StockUpdateFilterDTO filter) {
        validateDateTimeRange(filter.getStartDate(), filter.getEndDate(), "startDate", "endDate");
        validateNumericRange(filter.getMinChange(), filter.getMaxChange(), "minChange", "maxChange");
    }
}
