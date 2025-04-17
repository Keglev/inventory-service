package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor

public class SupplierController {
    private final SupplierService supplierService;

    @GetMapping
    public List<SupplierDTO> getAll() {
        return supplierService.getAll();
    }

    @GetMapping("/{id}")
    public SupplierDTO getById(@PathVariable String id) {
        return supplierService.getById(id);
    }

    @PostMapping
    public SupplierDTO create(@RequestBody SupplierDTO dto) {
        return supplierService.save(dto);
    }
    @GetMapping("/search")
    public List<SupplierDTO> searchByName(@RequestParam String name) {
     return supplierService.findByName(name);
    }
}
