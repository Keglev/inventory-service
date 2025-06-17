package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.service.StockHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.smartsupplypro.inventory.exception.GlobalExceptionHandler;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.context.annotation.Import;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

@Import({TestSecurityConfig.class, GlobalExceptionHandler.class})
@WebMvcTest(StockHistoryController.class)
@ActiveProfiles("test")
public class StockHistoryControllerTest {
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
                .timestamp(LocalDateTime.now())
                .build();
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetAll_shouldReturnList(String role) throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetByItemId_shouldReturnHistory(String role) throws Exception {
        when(stockHistoryService.getByItemId("item-1")).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/item/item-1")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetByReason_shouldReturnHistory(String role) throws Exception {
        when(stockHistoryService.getByReason(StockChangeReason.SOLD)).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/reason/SOLD")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
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

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetAll_whenEmpty_shouldReturnEmptyList(String role) throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/stock-history")
                .with(user("mockuser").roles(role)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
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

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetByReason_withInvalidEnum_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/INVALID_REASON")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testSearch_withNoParams_shouldReturnPage(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testSearch_withOnlyItemName_shouldReturnPage(String role) throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                .param("itemName", "item")
                .with(user("mockuser").roles(role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"USER", "ADMIN"})
    void testGetByReason_withLowercase_shouldReturnBadRequest(String role) throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/sold")  // instead of "SOLD"
                .with(user("mockuser").roles(role)))
                .andExpect(status().isBadRequest());
    }
} 
