package com.smartsupplypro.inventory.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import com.smartsupplypro.inventory.dto.DashboardSummaryDTO;
import com.smartsupplypro.inventory.dto.PriceTrendDTO;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.service.AnalyticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;

/**
 * Security-focused tests for {@link AnalyticsController}.
 *
 * <p><strong>Goal:</strong> verify Spring Security integration returns the expected
 * HTTP status codes (401/403) for unauthenticated and unauthorized requests across endpoints.</p>
 *
 * <p><strong>Note:</strong> These expectations assume analytics endpoints require authentication
 * and the <code>ADMIN</code> role. If your security configuration differs, adjust the expected
 * statuses accordingly (e.g., 200 for authenticated non-admins).</p>
 */
@WebMvcTest(controllers = AnalyticsController.class)
@ActiveProfiles("test")
class AnalyticsControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AnalyticsService analyticsService; // stubbed to avoid service logic

    // ------------- helpers -------------
    private static final String ADMIN = "ADMIN";
    private static final String USER  = "USER";

    @Nested
    @DisplayName("GET /api/analytics/stock-value")
    class StockValue {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(get("/api/analytics/stock-value")
                            .param("start","2024-02-01")
                            .param("end","2024-02-28"))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(get("/api/analytics/stock-value")
                            .param("start","2024-02-01")
                            .param("end","2024-02-28")
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/analytics/stock-per-supplier")
    class StockPerSupplier {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(get("/api/analytics/stock-per-supplier"))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(get("/api/analytics/stock-per-supplier")
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/analytics/item-update-frequency")
    class ItemUpdateFrequency {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(get("/api/analytics/item-update-frequency")
                            .param("supplierId","S1"))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(get("/api/analytics/item-update-frequency")
                            .param("supplierId","S1")
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/analytics/low-stock-items")
    class LowStockItems {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(get("/api/analytics/low-stock-items")
                            .param("supplierId","S1"))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(get("/api/analytics/low-stock-items")
                            .param("supplierId","S1")
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/analytics/monthly-stock-movement")
    class MonthlyStockMovement {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(get("/api/analytics/monthly-stock-movement")
                            .param("start","2024-02-01")
                            .param("end","2024-03-31"))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(get("/api/analytics/monthly-stock-movement")
                            .param("start","2024-02-01")
                            .param("end","2024-03-31")
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/analytics/stock-updates")
    class StockUpdatesGET {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(get("/api/analytics/stock-updates"))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(get("/api/analytics/stock-updates")
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("POST /api/analytics/stock-updates/query")
    class StockUpdatesPOST {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(post("/api/analytics/stock-updates/query")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"itemName\":\"x\"}"))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(post("/api/analytics/stock-updates/query")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"itemName\":\"x\"}")
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/analytics/summary")
    class Summary {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(get("/api/analytics/summary"))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(get("/api/analytics/summary")
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/analytics/price-trend")
    class PriceTrend {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(get("/api/analytics/price-trend")
                            .param("itemId","I1")
                            .param("start", LocalDate.now().minusDays(7).toString())
                            .param("end", LocalDate.now().toString()))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(get("/api/analytics/price-trend")
                            .param("itemId","I1")
                            .param("start", LocalDate.now().minusDays(7).toString())
                            .param("end", LocalDate.now().toString())
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("GET /api/analytics/financial/summary")
    class FinancialSummary {
        @Test
        void unauthenticated_is401() throws Exception {
            mockMvc.perform(get("/api/analytics/financial/summary")
                            .param("from","2024-02-01")
                            .param("to","2024-02-28"))
                   .andExpect(status().isUnauthorized());
        }

        @Test
        void authenticated_nonAdmin_is403() throws Exception {
            mockMvc.perform(get("/api/analytics/financial/summary")
                            .param("from","2024-02-01")
                            .param("to","2024-02-28")
                            .with(user("u").roles(USER)))
                   .andExpect(status().isForbidden());
        }
    }
}

