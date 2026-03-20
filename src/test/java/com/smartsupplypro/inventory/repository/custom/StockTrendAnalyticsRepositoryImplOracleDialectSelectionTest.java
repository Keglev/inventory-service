package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.smartsupplypro.inventory.repository.custom.util.DatabaseDialectDetector;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;

/**
 * Unit tests that cover the <em>Oracle dialect branch selection</em> in
 * {@link StockTrendAnalyticsRepositoryImpl} without executing Oracle SQL.
 *
 * <p>Why: the Oracle SQL uses functions like TO_CHAR / TRUNC which are not
 * guaranteed to run on H2, but the implementation still needs branch coverage.
 *
 * <p>Strategy:
 * <ul>
 *   <li>Force {@code detector.isH2() == false} to select Oracle SQL branches.</li>
 *   <li>Mock {@link EntityManager#createNativeQuery(String)} to capture generated SQL.</li>
 *   <li>Verify that blank supplier inputs normalize to {@code null} parameters.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class StockTrendAnalyticsRepositoryImplOracleDialectSelectionTest {

    @Mock private DatabaseDialectDetector detector;
    @Mock private EntityManager em;
    @Mock private Query query;

    @Test
    void oracleDialect_selected_forAllMethods_andSupplierBlankNormalizesToNull() {
        org.mockito.Mockito.when(detector.isH2()).thenReturn(false);
        org.mockito.Mockito.when(em.createNativeQuery(org.mockito.ArgumentMatchers.anyString())).thenReturn(query);
        org.mockito.Mockito.when(query.setParameter(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any()))
            .thenReturn(query);
        org.mockito.Mockito.when(query.getResultList()).thenReturn(Collections.emptyList());

        StockTrendAnalyticsRepositoryImpl repo = new StockTrendAnalyticsRepositoryImpl(detector);
        injectEntityManager(repo, em);

        LocalDateTime start = LocalDateTime.of(2024, 2, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2024, 3, 31, 23, 59);

        repo.getMonthlyStockMovement(start, end);
        repo.getMonthlyStockMovementBySupplier(start, end, "   ");
        repo.getDailyStockValuation(start, end, "   ");
        repo.getItemPriceTrend("itemA", "   ", start, end);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        org.mockito.Mockito.verify(em, org.mockito.Mockito.times(4)).createNativeQuery(sql.capture());

        // Monthly movement query should use TO_CHAR(..., 'YYYY-MM') in Oracle branch.
        assertTrue(sql.getAllValues().get(0).contains("TO_CHAR"));
        assertTrue(sql.getAllValues().get(0).contains("YYYY-MM"));

        // Supplier-filtered monthly movement should still be Oracle-flavored.
        assertTrue(sql.getAllValues().get(1).contains("TO_CHAR"));

        // Daily valuation uses TRUNC in Oracle variant.
        assertTrue(sql.getAllValues().get(2).contains("TRUNC"));

        // Price trend uses YYYY-MM-DD in Oracle variant.
        assertTrue(sql.getAllValues().get(3).contains("YYYY-MM-DD"));

        // Blank supplier should normalize to a NULL parameter to disable supplier filtering.
        org.mockito.Mockito.verify(query, org.mockito.Mockito.atLeastOnce())
            .setParameter("supplierId", null);
    }

    /** Injects the {@link EntityManager} into the repository under test (field injection mirror). */
    private static void injectEntityManager(Object target, EntityManager em) {
        try {
            Field f = target.getClass().getDeclaredField("em");
            f.setAccessible(true);
            f.set(target, em);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Failed to inject EntityManager into repository under test", e);
        }
    }
}
