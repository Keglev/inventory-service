package com.smartsupplypro.inventory.controller.analytics;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.StockUpdateAnalyticsController;
import com.smartsupplypro.inventory.dto.StockUpdateFilterDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.impl.analytics.StockAnalyticsService;

/**
 * Tests {@link StockUpdateAnalyticsController} GET and POST filtering endpoints using {@link MockMvc},
 * covering date-range defaults, parameter validation, and filter criteria processing.
 */
@WebMvcTest(StockUpdateAnalyticsController.class)
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
public class AnalyticsControllerFilteringTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockAnalyticsService stockAnalyticsService;

    @MockitoBean
    private AnalyticsControllerValidationHelper validationHelper;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setup() {
        // GET endpoints build the filter object through the helper; run the real method
        when(validationHelper.buildFilter(any(), any(), any(), any(), any(), any(), any()))
            .thenCallRealMethod();
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_return_filtered_stock_updates_when_posted(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setItemName("ItemX");
        filter.setSupplierId("Supplier A");
        filter.setStartDate(LocalDateTime.now().minusDays(10));
        filter.setEndDate(LocalDateTime.now());

        mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles(role))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filter)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_return_filtered_stock_updates_when_requested_by_get(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role))
                .param("startDate", "2024-05-01T00:00:00")
                .param("endDate", "2024-05-15T23:59:59")
                .param("itemName", "ItemX")
                .param("supplierId", "Supplier A"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_use_the_default_start_date_when_it_is_missing_from_a_post(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setEndDate(LocalDateTime.now());

        mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles(role))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filter)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_use_the_default_start_date_when_it_is_missing_from_a_get(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role))
                .param("endDate", "2024-05-15T23:59:59")
                .param("itemName", "ItemX"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_use_the_default_end_date_when_it_is_missing_from_a_post(String role) throws Exception {
        List<StockUpdateResultDTO> sample = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenReturn(sample);

        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setStartDate(LocalDateTime.now().minusDays(10));

        mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles(role))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filter)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].itemName").value("ItemX"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_return_empty_when_a_get_carries_no_filters(String role) throws Exception {
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class)))
            .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role)))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_return_400_when_the_start_date_format_is_invalid(String role) throws Exception {
        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles(role))
                .param("startDate", "invalid-date"))
            .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_return_an_empty_list_when_the_post_body_is_missing(String role) throws Exception {
        mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles(role))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isOk())
            .andExpect(content().json("[]"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_return_one_page_with_the_total_when_the_paged_endpoint_is_requested(String role) throws Exception {
        List<StockUpdateResultDTO> rows = List.of(
            new StockUpdateResultDTO("ItemX", "Supplier A", 5, "SALE", "admin", LocalDateTime.now())
        );
        when(stockAnalyticsService.getFilteredStockUpdatesPage(any(StockUpdateFilterDTO.class), eq(PageRequest.of(2, 10))))
            .thenReturn(new PageImpl<>(rows, PageRequest.of(2, 10), 21));

        mockMvc.perform(get("/api/analytics/stock-updates/page")
                .with(user("mockuser").roles(role))
                .param("itemName", "ItemX")
                .param("page", "2"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].itemName").value("ItemX"))
            .andExpect(jsonPath("$.page.totalElements").value(21));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "USER"})
    void should_cap_the_page_size_and_floor_the_page_index_when_they_are_out_of_range(String role) throws Exception {
        when(stockAnalyticsService.getFilteredStockUpdatesPage(any(StockUpdateFilterDTO.class), eq(PageRequest.of(0, 100))))
            .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 0));

        mockMvc.perform(get("/api/analytics/stock-updates/page")
                .with(user("mockuser").roles(role))
                .param("page", "-3")
                .param("size", "5000"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.page.totalElements").value(0));
    }

    @Test
    void should_return_400_when_a_get_carries_an_inverted_date_range() throws Exception {
        // the window and range checks live in the service: run the real method behind the mock
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenCallRealMethod();

        mockMvc.perform(get("/api/analytics/stock-updates")
                .with(user("mockuser").roles("ADMIN"))
                .param("startDate", "2024-05-15T00:00:00")
                .param("endDate", "2024-05-01T00:00:00"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("startDate must be on or before endDate"));
    }

    @Test
    void should_return_400_when_a_paged_get_has_min_change_above_max_change() throws Exception {
        when(stockAnalyticsService.getFilteredStockUpdatesPage(any(StockUpdateFilterDTO.class), any()))
            .thenCallRealMethod();

        mockMvc.perform(get("/api/analytics/stock-updates/page")
                .with(user("mockuser").roles("ADMIN"))
                .param("minChange", "5")
                .param("maxChange", "1"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("minChange must be <= maxChange"));
    }

    @Test
    void should_return_400_when_a_posted_filter_has_min_change_above_max_change() throws Exception {
        when(stockAnalyticsService.getFilteredStockUpdates(any(StockUpdateFilterDTO.class))).thenCallRealMethod();
        StockUpdateFilterDTO filter = new StockUpdateFilterDTO();
        filter.setMinChange(5);
        filter.setMaxChange(1);

        mockMvc.perform(post("/api/analytics/stock-updates/query")
                .with(user("mockuser").roles("ADMIN"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(filter)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("minChange must be <= maxChange"));
    }
}
