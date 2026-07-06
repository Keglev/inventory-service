package com.smartsupplypro.inventory.service.impl.analytics;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.EmployeeActivityDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

import lombok.RequiredArgsConstructor;

import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.asLocalDateTime;
import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.asNumber;
import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.blankToNull;
import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.defaultAndValidateDateWindow;
import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.endOfDay;
import static com.smartsupplypro.inventory.service.impl.analytics.AnalyticsConverterHelper.startOfDay;

/**
 * Per-employee change analytics.
 *
 * <p>SQL aggregates at DAILY granularity only (dialect-safe); weekly and monthly
 * rollups happen here via {@code java.time} ISO week/month arithmetic. Display
 * names are resolved from the user table by email, falling back to the raw
 * audit identity when no user row exists (e.g. system-generated changes).</p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeAnalyticsService {

    private static final Set<String> GRANULARITIES = Set.of("daily", "weekly", "monthly");

    private final StockHistoryRepository stockHistoryRepository;
    private final AppUserRepository appUserRepository;

    /**
     * Aggregates change counts per employee per time bucket.
     * Defaults to the last 30 days when bounds are null.
     *
     * @param granularity {@code daily}, {@code weekly}, or {@code monthly} (null = monthly)
     * @param startDate   inclusive start date (nullable)
     * @param endDate     inclusive end date (nullable)
     * @return activity rows ordered by period ascending, then creator
     * @throws InvalidRequestException on unknown granularity or inverted window
     */
    public List<EmployeeActivityDTO> getEmployeeActivity(String granularity,
                                                         LocalDate startDate,
                                                         LocalDate endDate) {
        final String g = granularity == null ? "monthly" : granularity.toLowerCase(Locale.ROOT);
        if (!GRANULARITIES.contains(g)) {
            throw new InvalidRequestException("granularity must be one of: daily, weekly, monthly");
        }
        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);

        List<Object[]> rows = stockHistoryRepository.getDailyEmployeeActivity(
                startOfDay(window[0]), endOfDay(window[1]));
        Map<String, String> displayNames = loadDisplayNames();

        // creator -> (period -> count); TreeMap keeps periods sorted per creator
        Map<String, Map<String, Long>> byEmployee = new LinkedHashMap<>();
        for (Object[] r : rows) {
            String createdBy = (String) r[0];
            LocalDate day = LocalDate.parse((String) r[1]);
            long count = asNumber(r[2]).longValue();
            byEmployee.computeIfAbsent(createdBy, k -> new TreeMap<>())
                      .merge(toPeriodKey(day, g), count, Long::sum);
        }

        List<EmployeeActivityDTO> out = new ArrayList<>();
        for (Map.Entry<String, Map<String, Long>> e : byEmployee.entrySet()) {
            String createdBy = e.getKey();
            String displayName = displayNames.getOrDefault(createdBy.toLowerCase(Locale.ROOT), createdBy);
            for (Map.Entry<String, Long> p : e.getValue().entrySet()) {
                out.add(new EmployeeActivityDTO(p.getKey(), createdBy, displayName, p.getValue()));
            }
        }
        out.sort(Comparator.comparing(EmployeeActivityDTO::period)
                           .thenComparing(EmployeeActivityDTO::createdBy));
        return out;
    }

    /**
     * Paginated change list, optionally filtered to one employee.
     * Defaults to the last 30 days when bounds are null.
     *
     * @param createdBy optional creator (email) filter, case-insensitive
     * @param startDate inclusive start date (nullable)
     * @param endDate   inclusive end date (nullable)
     * @param pageable  page/size (unsorted; ordering is newest-first in SQL)
     * @return page of change rows with resolved item and supplier names
     * @throws InvalidRequestException on inverted window
     */
    public Page<StockUpdateResultDTO> getEmployeeChanges(String createdBy,
                                                         LocalDate startDate,
                                                         LocalDate endDate,
                                                         Pageable pageable) {
        LocalDate[] window = defaultAndValidateDateWindow(startDate, endDate);
        Page<Object[]> page = stockHistoryRepository.findEmployeeChanges(
                startOfDay(window[0]), endOfDay(window[1]), blankToNull(createdBy), pageable);

        return page.map(r -> new StockUpdateResultDTO(
                (String) r[0],
                (String) r[1],
                asNumber(r[2]).intValue(),
                (String) r[3],
                (String) r[4],
                asLocalDateTime(r[5])
        ));
    }

    private String toPeriodKey(LocalDate day, String granularity) {
        return switch (granularity) {
            case "daily" -> day.toString();
            case "weekly" -> String.format("%d-W%02d",
                    day.get(IsoFields.WEEK_BASED_YEAR),
                    day.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR));
            default -> YearMonth.from(day).toString();
        };
    }

    /**
     * Email -> display name map. Rows without an email are skipped; rows
     * without a name fall back to the email. OAuth-provisioned users are not
     * guaranteed to carry a name, so this must never NPE on production data.
     */
    private Map<String, String> loadDisplayNames() {
        Map<String, String> names = new HashMap<>();
        for (AppUser u : appUserRepository.findAll()) {
            String email = u.getEmail();
            if (email == null || email.isBlank()) {
                continue;
            }
            String display = (u.getName() == null || u.getName().isBlank()) ? email : u.getName();
            names.putIfAbsent(email.toLowerCase(Locale.ROOT), display);
        }
        return names;
    }
}
