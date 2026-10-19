package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Shapes analytics request parameters at the HTTP boundary.
 *
 * <p>Input rules that hold for every caller (date order, quantity ranges, blank
 * ids, the stock-update window default) belong to the services, which check them
 * once. What remains here is specific to an endpoint: the dashboard summary's
 * window, which no single service owns, and the stock-update filter object.</p>
 */
@Component
public class AnalyticsControllerValidationHelper {

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
     * Defaults each missing bound on its own: start to 30 days ago, end to now.
     *
     * <p>For the dashboard summary, which feeds both bounds to
     * {@code LocalDateTime.toLocalDate()}. The stock-update window differs: the
     * service keeps a lone bound open-ended there, because those queries accept a
     * null bound; reusing that rule here let a lone date through as a null and
     * answered 500.</p>
     *
     * @param startDate requested start (nullable)
     * @param endDate requested end (nullable)
     * @return array with [startDate, endDate], both non-null
     */
    public LocalDateTime[] completeDateWindow(LocalDateTime startDate, LocalDateTime endDate) {
        LocalDateTime now = LocalDateTime.now();
        return new LocalDateTime[]{
            startDate != null ? startDate : now.minusDays(30),
            endDate != null ? endDate : now
        };
    }

    /**
     * Builds a {@link StockUpdateFilterDTO} from individual query parameters.
     *
     * <p>Extracted from {@link com.smartsupplypro.inventory.controller.StockUpdateAnalyticsController}
     * to keep the endpoint method under 15 lines.</p>
     *
     * @param startDate  optional start datetime
     * @param endDate    optional end datetime
     * @param itemName   optional item name filter
     * @param supplierId optional supplier filter
     * @param createdBy  optional creator filter
     * @param minChange  optional minimum quantity change
     * @param maxChange  optional maximum quantity change
     * @return populated filter DTO
     */
    public StockUpdateFilterDTO buildFilter(
            LocalDateTime startDate, LocalDateTime endDate,
            String itemName, String supplierId, String createdBy,
            Integer minChange, Integer maxChange) {

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(startDate);
        filter.setEndDate(endDate);
        filter.setItemName(itemName);
        filter.setSupplierId(supplierId);
        filter.setCreatedBy(createdBy);
        filter.setMinChange(minChange);
        filter.setMaxChange(maxChange);
        return filter;
    }
}
