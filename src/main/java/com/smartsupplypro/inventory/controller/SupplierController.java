package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.service.SupplierService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasRole('ADMIN')")  // Only Admins can create suppliers
    public ResponseEntity<SupplierDTO> create(@RequestBody @Valid SupplierDTO supplierDTO) {
        SupplierDTO saved = supplierService.save(supplierDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved); 
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")  // Only Admins can update suppliers
    public ResponseEntity<SupplierDTO> update(@PathVariable String id, @RequestBody @Valid SupplierDTO supplierDTO) {
        return supplierService.update(id, supplierDTO)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")  // Only Admins can delete suppliers
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public List<SupplierDTO> searchByName(@RequestParam String name) {
     return supplierService.findByName(name);
    }
}
