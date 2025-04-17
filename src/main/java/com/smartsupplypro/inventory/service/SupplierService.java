package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.mapper.SupplierMapper;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class SupplierService {
    private final SupplierRepository repository;

    public List<SupplierDTO> getAll() {
        return repository.findAll().stream()
                .map(SupplierMapper::toDTO)
                .collect(Collectors.toList());
    }

    public SupplierDTO getById(String id) {
        Optional<Supplier> supplier = repository.findById(id);
        return supplier.map(SupplierMapper::toDTO).orElse(null);
    }

    public List<SupplierDTO> findByName(String name) {
        return repository.findByNameContainingIgnoreCase(name).stream()
                .map(SupplierMapper::toDTO)
                .collect(Collectors.toList());
    }

    public SupplierDTO save(SupplierDTO dto) {
        Supplier entity = SupplierMapper.toEntity(dto);

        // Set current timestamp if not provided
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }

        Supplier saved = repository.save(entity);
        return SupplierMapper.toDTO(saved);
    }
}
