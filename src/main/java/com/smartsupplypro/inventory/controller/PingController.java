package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class PingController {

    private final InventoryItemRepository repository;

    public PingController(InventoryItemRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/ping")
    public String ping() {
        long count = repository.count(); // DB call
        return "Database connected! Inventory item count: " + count;
    }
}

