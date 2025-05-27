package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.mapper.SupplierMapper;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.validation.SupplierValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import com.smartsupplypro.inventory.exception.DuplicateResourceException;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public List<SupplierDTO> getAll() {
        return supplierRepository.findAll().stream()
                .map(SupplierMapper::toDTO)
                .collect(Collectors.toList());
    }

    public SupplierDTO getById(String id) {
        return supplierRepository.findById(id)
                .map(SupplierMapper::toDTO)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
    }

    public List<SupplierDTO> findByName(String name) {
        return supplierRepository.findByNameContainingIgnoreCase(name).stream()
                .map(SupplierMapper::toDTO)
                .collect(Collectors.toList());
    }

    public SupplierDTO save(SupplierDTO dto) {
        SupplierValidator.validateBase(dto);
        if (supplierRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new DuplicateResourceException("A Supplier with this name already exists.");
        }

        Supplier entity = SupplierMapper.toEntity(dto);

        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }

        Supplier saved = supplierRepository.save(entity);
        return SupplierMapper.toDTO(saved);
    }

    public Optional<SupplierDTO> update(String id, SupplierDTO dto) {
        SupplierValidator.validateBase(dto);

        return supplierRepository.findById(id)
            .map(existing -> {
                if (!existing.getName().equalsIgnoreCase(dto.getName())
                        && supplierRepository.existsByNameIgnoreCase(dto.getName())) {
                    throw new DuplicateResourceException("A Supplier with this name already exists.");
                }
                existing.setName(dto.getName());
                existing.setContactName(dto.getContactName());
                existing.setPhone(dto.getPhone());
                existing.setEmail(dto.getEmail());
                existing.setCreatedBy(dto.getCreatedBy());

                Supplier updated = supplierRepository.save(existing);
                return SupplierMapper.toDTO(updated);
            });
    }

    public void delete(String supplierId) {
        SupplierValidator.validateDeletable(supplierId, inventoryItemRepository);
        supplierRepository.deleteById(supplierId);
    }
}
