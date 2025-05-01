package com.smartsupplypro.inventory.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class SupplierDTO {
    private String id;
    private String name;
    private String contactName;
    private String phone;
    private String email;
    private String createdBy;
    private LocalDateTime createdAt;
}
