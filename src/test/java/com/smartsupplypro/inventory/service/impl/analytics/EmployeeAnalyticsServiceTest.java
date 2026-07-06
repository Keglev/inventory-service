package com.smartsupplypro.inventory.service.impl.analytics;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Page;

import com.smartsupplypro.inventory.dto.EmployeeActivityDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for granularity rollups, display-name resolution, and the
 * paginated projection mapping.
 */
@ExtendWith(MockitoExtension.class)
class EmployeeAnalyticsServiceTest {

    @Mock private StockHistoryRepository stockHistoryRepository;
    @Mock private AppUserRepository appUserRepository;
    @InjectMocks private EmployeeAnalyticsService service;

    private static Object[] row(String createdBy, String day, long count) {
        return new Object[] { createdBy, day, count };
    }

    private static AppUser user(String email, String name) {
        AppUser u = new AppUser(email, name);
        return u;
    }

    @Test
    void monthlyRollup_mergesDays_andResolvesDisplayName() {
        when(stockHistoryRepository.getDailyEmployeeActivity(any(), any()))
                .thenReturn(List.of(
                        row("jonas.weber@example.com", "2026-03-02", 3),
                        row("jonas.weber@example.com", "2026-03-15", 2)));
        when(appUserRepository.findAll())
                .thenReturn(List.of(user("jonas.weber@example.com", "Jonas Weber")));

        List<EmployeeActivityDTO> out = service.getEmployeeActivity(
                "monthly", LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));

        assertEquals(1, out.size());
        assertEquals("2026-03", out.get(0).period());
        assertEquals(5L, out.get(0).changeCount());
        assertEquals("Jonas Weber", out.get(0).displayName());
    }

    @Test
    void weeklyRollup_usesIsoWeek_acrossYearBoundary() {
        // 2025-12-29 (Mon) and 2026-01-01 (Thu) are BOTH in ISO week 2026-W01
        when(stockHistoryRepository.getDailyEmployeeActivity(any(), any()))
                .thenReturn(List.of(
                        row("ana.ferreira@example.com", "2025-12-29", 1),
                        row("ana.ferreira@example.com", "2026-01-01", 2)));
        when(appUserRepository.findAll()).thenReturn(List.of());

        List<EmployeeActivityDTO> out = service.getEmployeeActivity(
                "weekly", LocalDate.of(2025, 12, 20), LocalDate.of(2026, 1, 10));

        assertEquals(1, out.size());
        assertEquals("2026-W01", out.get(0).period());
        assertEquals(3L, out.get(0).changeCount());
    }

    @Test
    void daily_keepsSeparateDays_andFallsBackToEmail() {
        when(stockHistoryRepository.getDailyEmployeeActivity(any(), any()))
                .thenReturn(List.of(
                        row("ghost@example.com", "2026-02-01", 1),
                        row("ghost@example.com", "2026-02-02", 4)));
        when(appUserRepository.findAll()).thenReturn(List.of());

        List<EmployeeActivityDTO> out = service.getEmployeeActivity(
                "daily", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertEquals(2, out.size());
        assertEquals("2026-02-01", out.get(0).period());
        assertEquals("ghost@example.com", out.get(0).displayName());
        assertEquals("2026-02-02", out.get(1).period());
        assertEquals(4L, out.get(1).changeCount());
    }

    @Test
    void displayNameLookup_toleratesNullUserName() {
        when(stockHistoryRepository.getDailyEmployeeActivity(any(), any()))
                .thenReturn(List.<Object[]>of(row("ghost@example.com", "2026-02-01", 1)));
        when(appUserRepository.findAll()).thenReturn(List.of(user("ghost@example.com", null)));

        List<EmployeeActivityDTO> out = service.getEmployeeActivity(
                "daily", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28));

        assertEquals("ghost@example.com", out.get(0).displayName());
    }

    @Test
    void unknownGranularity_throwsInvalidRequest() {
        assertThrows(InvalidRequestException.class, () ->
                service.getEmployeeActivity("hourly", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28)));
    }

    @Test
    void getEmployeeChanges_mapsProjectionRows() {
        Object[] r = new Object[] {
                "Item A", "Supplier One", -3, "SOLD", "jonas.weber@example.com",
                Timestamp.valueOf(LocalDateTime.of(2026, 2, 3, 9, 0))
        };
        when(stockHistoryRepository.findEmployeeChanges(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.<Object[]>of(r), PageRequest.of(0, 25), 1));

        Page<StockUpdateResultDTO> out = service.getEmployeeChanges(
                "jonas.weber@example.com", LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28),
                PageRequest.of(0, 25));

        assertEquals(1L, out.getTotalElements());
        StockUpdateResultDTO dto = out.getContent().get(0);
        assertEquals("Item A", dto.itemName());
        assertEquals("Supplier One", dto.supplierName());
        assertEquals(-3, dto.change());
        assertEquals("SOLD", dto.reason());
        assertEquals(LocalDateTime.of(2026, 2, 3, 9, 0), dto.timestamp());
    }
}
