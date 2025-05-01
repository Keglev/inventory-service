package com.smartsupplypro.inventory.dto;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;



import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor

public class InventoryItemDTO {

    @NotBlank(message = "Item ID is mandatory")
    private String id;

    @NotBlank(message = "Item name is mandatory")
    private String name;

    @NotNull(message = "Quantity is mandatory")
    @PositiveOrZero(message = "Quantity must be zero or positive")
    private int quantity;

    @NotNull(message = "Price is mandatory")
    @Positive(message = "Price must be greater than zero")
    private BigDecimal price;


    private BigDecimal totalValue; // Computed field

    @NotBlank(message = "Supplier ID is mandatory")
    private String supplierId;

    private String createdBy;
    private LocalDateTime createdAt;
}
