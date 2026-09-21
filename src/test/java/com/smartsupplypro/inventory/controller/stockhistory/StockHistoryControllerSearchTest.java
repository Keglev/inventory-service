package com.smartsupplypro.inventory.controller.stockhistory;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
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
import com.smartsupplypro.inventory.controller.StockHistoryController;
import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * Tests {@link StockHistoryController} GET /api/stock-history/search endpoint covering filter
 * combinations, date-range validation, page-size capping, and authentication using {@link MockMvc}.
 */
@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
@WebMvcTest(StockHistoryController.class)
@ActiveProfiles("test")
class StockHistoryControllerSearchTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private StockHistoryService stockHistoryService;

    private StockHistoryDTO history;

    @BeforeEach
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

    private void stubSearchReturns(Page<StockHistoryDTO> page) {
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any(Pageable.class)))
                .thenReturn(page);
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_return_a_paged_result_when_filters_are_given(String role) throws Exception {
        stubSearchReturns(new PageImpl<>(List.of(history)));

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "item")
                        .param("supplierId", "supplier-1")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_return_an_empty_page_when_nothing_matches(String role) throws Exception {
        stubSearchReturns(Page.empty());

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "nonexistent")
                        .param("supplierId", "nonexistent")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_return_a_page_when_no_parameters_are_given(String role) throws Exception {
        stubSearchReturns(new PageImpl<>(List.of(history)));

        mockMvc.perform(get("/api/stock-history/search")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_return_a_page_when_only_the_item_name_is_given(String role) throws Exception {
        stubSearchReturns(new PageImpl<>(List.of(history)));

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "item")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_return_400_when_the_date_range_is_invalid(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/search")
                        .param("startDate", "2024-01-31T00:00:00")
                        .param("endDate", "2024-01-01T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());

        verify(stockHistoryService, never())
                .findFiltered(any(), any(), any(), any(), any(Pageable.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_return_a_page_when_only_the_start_date_is_given(String role) throws Exception {
        stubSearchReturns(new PageImpl<>(List.of(history)));

        mockMvc.perform(get("/api/stock-history/search")
                        .param("startDate", "2024-01-01T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_return_a_page_when_only_the_end_date_is_given(String role) throws Exception {
        stubSearchReturns(new PageImpl<>(List.of(history)));

        mockMvc.perform(get("/api/stock-history/search")
                        .param("endDate", "2024-01-31T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_return_a_page_when_the_date_range_is_valid(String role) throws Exception {
        stubSearchReturns(new PageImpl<>(List.of(history)));

        mockMvc.perform(get("/api/stock-history/search")
                        .param("startDate", "2024-01-01T00:00:00")
                        .param("endDate", "2024-01-31T00:00:00")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_cap_the_page_size_when_it_exceeds_the_limit(String role) throws Exception {
        stubSearchReturns(new PageImpl<>(List.of(history)));

        mockMvc.perform(get("/api/stock-history/search")
                        .param("size", "1000")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(stockHistoryService).findFiltered(any(), any(), any(), any(), pageableCaptor.capture());

        assertTrue(pageableCaptor.getValue().getPageSize() <= 200,
                "Controller should cap page size to <= 200");
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void should_keep_the_page_size_when_it_is_within_the_limit(String role) throws Exception {
        stubSearchReturns(new PageImpl<>(List.of(history)));

        mockMvc.perform(get("/api/stock-history/search")
                        .param("size", "10")
                        .with(user("mockuser").roles(role)))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(stockHistoryService).findFiltered(any(), any(), any(), any(), pageableCaptor.capture());

        assertTrue(pageableCaptor.getValue().getPageSize() == 10,
                "Controller should keep requested page size when <= 200");
    }

    @Test
    void should_return_401_when_searching_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/stock-history/search"))
                .andExpect(status().isUnauthorized());
    }
}
