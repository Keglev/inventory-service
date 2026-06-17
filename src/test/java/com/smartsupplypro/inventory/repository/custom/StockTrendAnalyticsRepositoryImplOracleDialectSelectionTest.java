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
 * Unit tests for Oracle dialect branch selection in {@link StockTrendAnalyticsRepositoryImpl}.
 */
@ExtendWith(MockitoExtension.class)
class StockTrendAnalyticsRepositoryImplOracleDialectSelectionTest {

    @Mock private DatabaseDialectDetector detector;
    @Mock private EntityManager em;
    @Mock private Query query;

    @Test
    void should_select_oracle_sql_for_all_methods_and_normalize_blank_supplier_to_null() {
        org.mockito.Mockito.when(detector.isH2()).thenReturn(false);
        org.mockito.Mockito.when(em.createNativeQuery(org.mockito.ArgumentMatchers.anyString())).thenReturn(query);
        org.mockito.Mockito.when(query.setParameter(org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any()))
            .thenReturn(query);
        org.mockito.Mockito.when(query.getResultList()).thenReturn(Collections.emptyList());

        StockTrendAnalyticsRepositoryImpl repo = new StockTrendAnalyticsRepositoryImpl(detector);
        injectEntityManager(repo, em);

        LocalDateTime start = LocalDateTime.of(2024, 2, 1, 0, 0);
        LocalDateTime end   = LocalDateTime.of(2024, 3, 31, 23, 59);

        repo.getMonthlyStockMovement(start, end);
        repo.getMonthlyStockMovementBySupplier(start, end, "   ");
        repo.getDailyStockValuation(start, end, "   ");
        repo.getItemPriceTrend("itemA", "   ", start, end);

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        org.mockito.Mockito.verify(em, org.mockito.Mockito.times(4)).createNativeQuery(sql.capture());

        // Oracle monthly movement uses TO_CHAR(..., 'YYYY-MM')
        assertTrue(sql.getAllValues().get(0).contains("TO_CHAR"));
        assertTrue(sql.getAllValues().get(0).contains("YYYY-MM"));
        // Oracle supplier-filtered movement is also TO_CHAR-flavored
        assertTrue(sql.getAllValues().get(1).contains("TO_CHAR"));
        // Oracle daily valuation uses TRUNC
        assertTrue(sql.getAllValues().get(2).contains("TRUNC"));
        // Oracle price trend uses YYYY-MM-DD format
        assertTrue(sql.getAllValues().get(3).contains("YYYY-MM-DD"));

        // blank supplier must normalize to null so the supplier filter is disabled
        org.mockito.Mockito.verify(query, org.mockito.Mockito.atLeastOnce())
            .setParameter("supplierId", null);
    }

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
