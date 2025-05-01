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
import java.util.stream.Collectors;

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
        Optional<Supplier> supplier = supplierRepository.findById(id);
        return supplier.map(SupplierMapper::toDTO).orElse(null);
    }

    public List<SupplierDTO> findByName(String name) {
        return supplierRepository.findByNameContainingIgnoreCase(name).stream()
                .map(SupplierMapper::toDTO)
                .collect(Collectors.toList());
    }

    public SupplierDTO save(SupplierDTO dto) {
        Supplier entity = SupplierMapper.toEntity(dto);

        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }

        Supplier saved = supplierRepository.save(entity);
        return SupplierMapper.toDTO(saved);
    }

    public Optional<SupplierDTO> update(String id, SupplierDTO dto) {
        return supplierRepository.findById(id)
            .map(existing -> {
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
