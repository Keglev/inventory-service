package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.service.InventoryItemService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")

public class InventoryItemController {
    private final InventoryItemService inventoryItemService;

    public InventoryItemController(InventoryItemService inventoryItemService) {
        this.inventoryItemService = inventoryItemService;
    }

    @GetMapping
    public List<InventoryItemDTO> getAll() {
        return inventoryItemService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> getById(@PathVariable String id) {
        return inventoryItemService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<InventoryItemDTO> create(@Valid @RequestBody InventoryItemDTO inventoryItemDTO) {
        InventoryItemDTO savedItem = inventoryItemService.save(inventoryItemDTO);
        return new ResponseEntity<>(savedItem, HttpStatus.CREATED);
    }


    @PutMapping("/{id}")
    public ResponseEntity<InventoryItemDTO> update(@PathVariable String id, @Valid @RequestBody InventoryItemDTO inventoryItemDTO) {
        return inventoryItemService.update(id, inventoryItemDTO)
                .map(updatedItem -> ResponseEntity.ok(updatedItem))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, 
                                       @RequestParam StockChangeReason reason) {
        inventoryItemService.delete(id, reason);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public List<InventoryItemDTO> searchByName(@RequestParam String name) {
        return inventoryItemService.findByName(name);
    }
}
