package com.smartsupplypro.inventory.dto;

import lombok.*;

import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockHistoryDTO {
    private String id;
    private String itemId;
    private int change;
    private String reason;
    private String createdBy;
    private LocalDateTime timestamp;
}
