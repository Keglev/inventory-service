package com.smartsupplypro.inventory.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.Table;
import jakarta.persistence.Id;

@Entity
@Table(name = "SUPPLIER")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {
    @Id
    private String id;

    private String name;
    private String contactName;
    private String phone;
    private String email;
    private String createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
