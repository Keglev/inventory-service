package com.smartsupplypro.inventory.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartsupplypro.inventory.dto.EmployeeActivityDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.service.impl.analytics.EmployeeAnalyticsService;

import lombok.RequiredArgsConstructor;

/**
 * REST endpoints for per-employee change analytics.
 *
 * <p>Access policy: administrators, plus the anonymous read-only demo mode.
 * Regular authenticated users are deliberately excluded — employee-level
 * activity is a supervision view. Demo mode is NOT a role: demo sessions are
 * anonymous requests admitted by the {@code app.demo-readonly} switch, so the
 * gate combines {@code hasRole('ADMIN')} with an anonymous-plus-demo check.</p>
 */
@RestController
@RequestMapping(value = "/api/analytics", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
@Validated
public class EmployeeAnalyticsController {

    /** Upper bound on page size to protect memory on large audit datasets. */
    private static final int MAX_PAGE_SIZE = 100;

    private final EmployeeAnalyticsService employeeAnalyticsService;

    /**
     * Gets change counts per employee per time bucket.
     *
     * @param granularity {@code daily}, {@code weekly}, or {@code monthly} (default monthly)
     * @param startDate   optional inclusive start date (ISO yyyy-MM-dd)
     * @param endDate     optional inclusive end date (ISO yyyy-MM-dd)
     * @return activity rows ordered by period, then creator
     */
    @PreAuthorize("hasRole('ADMIN') or (!isAuthenticated() and @appProperties.demoReadonly)")
    @GetMapping("/by-employee")
    public ResponseEntity<List<EmployeeActivityDTO>> getEmployeeActivity(
            @RequestParam(required = false) String granularity,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        return ResponseEntity.ok(
                employeeAnalyticsService.getEmployeeActivity(granularity, startDate, endDate, supplierId));
    }

    /**
     * Gets a paginated change list, optionally filtered to one employee.
     *
     * @param createdBy optional creator (email) filter, case-insensitive
     * @param startDate optional inclusive start date (ISO yyyy-MM-dd)
     * @param endDate   optional inclusive end date (ISO yyyy-MM-dd)
     * @param page      zero-based page index (default 0)
     * @param size      page size (default 25, capped at {@value #MAX_PAGE_SIZE})
     * @return page of change rows, newest first
     */
    @PreAuthorize("hasRole('ADMIN') or (!isAuthenticated() and @appProperties.demoReadonly)")
    @GetMapping("/employee-changes")
    public ResponseEntity<Page<StockUpdateResultDTO>> getEmployeeChanges(
            @RequestParam(required = false) String createdBy,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE));
        return ResponseEntity.ok(
                employeeAnalyticsService.getEmployeeChanges(createdBy, startDate, endDate, supplierId, pageable));
    }
}
