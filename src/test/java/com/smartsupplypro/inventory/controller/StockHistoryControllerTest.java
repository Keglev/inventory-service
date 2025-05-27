package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.service.StockHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.*;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StockHistoryController.class)
@ActiveProfiles("test")
@WithMockUser(username = "audit_user", roles = {"USER"})
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

    @Test
    void testGetAll_shouldReturnList() throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    @Test
    void testGetByItemId_shouldReturnHistory() throws Exception {
        when(stockHistoryService.getByItemId("item-1")).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/item/item-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void testGetByReason_shouldReturnHistory() throws Exception {
        when(stockHistoryService.getByReason(StockChangeReason.SOLD)).thenReturn(List.of(history));

        mockMvc.perform(get("/api/stock-history/reason/SOLD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason").value("SOLD"));
    }

    @Test
    void testSearch_shouldReturnPagedResult() throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "item")
                        .param("supplierId", "supplier-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    void testGetAll_whenEmpty_shouldReturnEmptyList() throws Exception {
        when(stockHistoryService.getAll()).thenReturn(List.of());

        mockMvc.perform(get("/api/stock-history"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void testSearch_whenNoMatches_shouldReturnEmptyPage() throws Exception {
        Page<StockHistoryDTO> emptyPage = Page.empty();
        when(stockHistoryService.findFiltered(any(), any(), anyString(), anyString(), any(Pageable.class)))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/api/stock-history/search")
                        .param("itemName", "nonexistent")
                        .param("supplierId", "nonexistent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void testGetByReason_withInvalidEnum_shouldReturnBadRequest() throws Exception {
        mockMvc.perform(get("/api/stock-history/reason/INVALID_REASON"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testSearch_withNoParams_shouldReturnPage() throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    void testSearch_withOnlyItemName_shouldReturnPage() throws Exception {
        Page<StockHistoryDTO> page = new PageImpl<>(List.of(history));
        when(stockHistoryService.findFiltered(any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/stock-history/search")
                .param("itemName", "item"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

}
