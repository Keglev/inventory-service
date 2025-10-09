package com.smartsupplypro.inventory.controller;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * Web layer validation for stock history tracking operations.
 * Ensures temporal data integrity and inventory movement visibility
 * across all enterprise stakeholders and audit scenarios.
 *
 * <p>Stock history tracking provides comprehensive audit trail
 * for inventory movements, supporting compliance requirements
 * and operational transparency across supply chain operations.
 */
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
@WebMvcTest(StockHistoryController.class)
@ActiveProfiles("test")
class StockHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockHistoryService stockHistoryService;

    private StockHistoryDTO history;

    /**
     * Configures comprehensive stock history test scenario.
     *
     * <p><strong>Enterprise Context:</strong>
     * Stock history records provide critical audit trail for
     * inventory movements supporting compliance and operational visibility.
     */
    @BeforeEach
    @SuppressWarnings("unused")
    void setUp() {
        history = StockHistoryDTO.builder()
                .id("sh-1")
                .itemId("item-1")
                .change(5)
                .reason("SOLD")
                .createdBy("admin")
                .timestamp(LocalDateTime.of(2024, 1, 1, 10, 0))
                .build();
    }

    /**
     * Validates comprehensive stock history retrieval for all enterprise roles.
     *
     * <p><strong>Given:</strong> Historical stock movement data exists in system<br>
     * <strong>When:</strong> Authorized user requests complete history listing<br>
     * <strong>Then:</strong> Returns comprehensive audit trail with proper structure
     *
     * <p><strong>Enterprise Context:</strong>
     * All authenticated users require visibility into inventory movements
     * for operational transparency and audit compliance. Stock history access
     * supports decision-making across procurement, sales, and operations teams.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history -> 200 + list")
    void testGetAll_shouldReturnList(String role) throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    /**
     * Validates item-specific historical tracking across enterprise operations.
     *
     * <p><strong>Given:</strong> Stock movements exist for specific inventory item<br>
     * <strong>When:</strong> User requests item-specific history by identifier<br>
     * <strong>Then:</strong> Returns complete movement timeline for target item
     *
     * <p><strong>Enterprise Context:</strong>
     * Item-specific history tracking enables precise inventory analysis
     * and troubleshooting. Critical for identifying movement patterns,
     * investigating discrepancies, and supporting audit requirements.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/item/{itemId} -> 200 + list")
    void testGetByItemId_shouldReturnHistory(String role) throws Exception {
        when(stockHistoryService.getByItemId("item-1")).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/item/item-1")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    /**
     * Validates stock movement categorization by business reason codes.
     *
     * <p><strong>Given:</strong> Stock changes categorized by operational reasons<br>
     * <strong>When:</strong> User filters history by specific change reason<br>
     * <strong>Then:</strong> Returns movements matching requested category
     *
     * <p><strong>Enterprise Context:</strong>
     * Reason-based filtering enables operational analysis and performance
     * measurement. Critical for understanding sales patterns, loss analysis,
     * and operational efficiency across business units.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} -> 200 + list")
    void testGetByReason_shouldReturnHistory(String role) throws Exception {
        when(stockHistoryService.getByReason(StockChangeReason.SOLD)).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/reason/SOLD")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    /**
     * Validates advanced search capabilities with multi-criteria filtering.
     *
     * <p><strong>Given:</strong> Stock history with diverse filterable attributes<br>
     * <strong>When:</strong> User performs search with specific criteria<br>
     * <strong>Then:</strong> Returns paginated results matching all filters
     *
     * <p><strong>Enterprise Context:</strong>
     * Advanced search supports operational analysis and reporting.
     * Multi-criteria filtering enables precise data extraction for
     * business intelligence and compliance reporting.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (with filters) -> 200 + page")
    void testSearch_shouldReturnPagedResult(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "item")
                        .param("supplierId", "supplier-1")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    /**
     * Validates graceful handling of empty historical data scenarios.
     *
     * <p><strong>Given:</strong> No stock movement records exist in system<br>
     * <strong>When:</strong> User requests complete history listing<br>
     * <strong>Then:</strong> Returns empty collection with proper HTTP status
     *
     * <p><strong>Enterprise Context:</strong>
     * Empty state handling ensures consistent API behavior during
     * system initialization or after data purging operations.
     * Critical for maintaining client application stability.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history -> 200 + [] (empty)")
    void testGetAll_whenEmpty_shouldReturnEmptyList(String role) throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/stock-history")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    /**
     * Validates search behavior with non-matching filter criteria.
     *
     * <p><strong>Given:</strong> Stock history exists but doesn't match search filters<br>
     * <strong>When:</strong> User performs search with non-matching criteria<br>
     * <strong>Then:</strong> Returns empty page with proper pagination structure
     *
     * <p><strong>Enterprise Context:</strong>
     * No-match scenarios ensure robust search functionality and
     * consistent pagination behavior. Supports user confidence
     * in search accuracy and system reliability.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (no matches) -> 200 + empty page")
    void testSearch_whenNoMatches_shouldReturnEmptyPage(String role) throws Exception {
        Page<StockHistoryDTO> emptyPage = Page.empty();
        when(stockHistoryService.findFiltered(any(), any(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "nonexistent")
                        .param("supplierId", "nonexistent")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    /**
     * Validates input validation for invalid stock change reason codes.
     *
     * <p><strong>Given:</strong> Invalid reason enumeration value provided<br>
     * <strong>When:</strong> User requests history filtering by invalid reason<br>
     * <strong>Then:</strong> Returns client error with appropriate status code
     *
     * <p><strong>Enterprise Context:</strong>
     * Input validation protects data integrity and prevents
     * system errors from invalid parameter values. Ensures
     * robust API behavior under malformed requests.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} (invalid) -> 400")
    void testGetByReason_withInvalidEnum_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/INVALID_REASON")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Validates search functionality with minimal parameter requirements.
     *
     * <p><strong>Given:</strong> Search endpoint available without mandatory filters<br>
     * <strong>When:</strong> User performs search without any filter parameters<br>
     * <strong>Then:</strong> Returns paginated results with default behavior
     *
     * <p><strong>Enterprise Context:</strong>
     * Parameter-free search enables broad data exploration and
     * simplifies initial user interactions. Supports flexible
     * reporting requirements across business units.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (no params) -> 200 + page")
    void testSearch_withNoParams_shouldReturnPage(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    /**
     * Validates partial search criteria handling with single filter.
     *
     * <p><strong>Given:</strong> Search supports multiple optional filter parameters<br>
     * <strong>When:</strong> User provides only item name filter parameter<br>
     * <strong>Then:</strong> Returns filtered results based on single criterion
     *
     * <p><strong>Enterprise Context:</strong>
     * Partial filtering enables flexible search patterns and
     * accommodates varied reporting needs. Supports incremental
     * query refinement for user-friendly data exploration.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (itemName only) -> 200 + page")
    void testSearch_withOnlyItemName_shouldReturnPage(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "item")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    /**
     * Validates strict enumeration case sensitivity for reason codes.
     *
     * <p><strong>Given:</strong> Reason enumeration requires exact case matching<br>
     * <strong>When:</strong> User provides lowercase reason code instead of uppercase<br>
     * <strong>Then:</strong> Returns client error indicating invalid parameter
     *
     * <p><strong>Enterprise Context:</strong>
     * Case-sensitive validation ensures data consistency and
     * prevents ambiguous interpretations. Maintains strict
     * API contracts for reliable system integration.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/reason/{reason} (lowercase) -> 400")
    void testGetByReason_withLowercase_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/sold")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    /**
     * Validates temporal data integrity with invalid date range parameters.
     *
     * <p><strong>Given:</strong> Date range validation rules enforce logical chronology<br>
     * <strong>When:</strong> User provides end date before start date<br>
     * <strong>Then:</strong> Returns validation error without service layer invocation
     *
     * <p><strong>Enterprise Context:</strong>
     * Date range validation prevents temporal data inconsistencies
     * and protects against nonsensical reporting parameters.
     * Early validation improves system performance and user experience.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (invalid date range) -> 400 + service not called")
    void testSearch_withInvalidDateRange_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/search")
                        .param("startDate", "2024-01-31T00:00:00")
                        .param("endDate", "2024-01-01T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());

        verify(stockHistoryService, never())
                .findFiltered(any(), any(), any(), any(), any(Pageable.class));
    }

    /**
     * Validates authentication enforcement for stock history access.
     *
     * <p><strong>Given:</strong> Stock history endpoints require authentication<br>
     * <strong>When:</strong> Unauthenticated user attempts to access history data<br>
     * <strong>Then:</strong> Returns unauthorized status without data exposure
     *
     * <p><strong>Enterprise Context:</strong>
     * Authentication enforcement protects sensitive inventory data
     * and ensures compliance with security policies. Critical
     * for preventing unauthorized access to operational intelligence.
     */
    @Test
    @DisplayName("GET /api/stock-history (no auth) -> 401")
    void testGetAll_withoutAuthentication_shouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/stock-history"))
                .andExpect(status().isUnauthorized());
    }

    /**
     * Validates defensive pagination limits for performance protection.
     *
     * <p><strong>Given:</strong> System enforces maximum page size limits<br>
     * <strong>When:</strong> User requests oversized page exceeding system limits<br>
     * <strong>Then:</strong> Automatically caps page size to protect system performance
     *
     * <p><strong>Enterprise Context:</strong>
     * Page size limits prevent resource exhaustion and maintain
     * system responsiveness under heavy load. Protects against
     * accidental or malicious oversized data requests.
     */
    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    @DisplayName("GET /api/stock-history/search (oversize page) -> capped page size")
    void testSearch_withLargePageSize_shouldReturnLimitedResults(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("size", "1000") // above cap
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(stockHistoryService).findFiltered(any(), any(), any(), any(), pageableCaptor.capture());

        assertTrue(pageableCaptor.getValue().getPageSize() <= 200,
                "Controller should cap page size to <= 200");
    }
}
