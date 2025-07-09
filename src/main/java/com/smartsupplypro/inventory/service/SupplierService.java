package com.smartsupplypro.inventory.service;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.mapper.SupplierMapper;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.validation.SupplierValidator;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

/**
 * Service class responsible for business logic related to Supplier entities.
 * <p>
 * This class acts as a mediator between the controller and repository layers,
 * offering methods to:
 * <ul>
 *   <li>Retrieve, filter, create, update, and delete suppliers</li>
 *   <li>Ensure validation and uniqueness constraints</li>
 *   <li>Enforce safe deletion with dependency checks on inventory items</li>
 * </ul>
 * Validation logic is enforced via {@link SupplierValidator}.
 * </p>
 *
 * @author
 * SmartSupplyPro Dev Team
 */
@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /**
     * Retrieves all suppliers stored in the system.
     *
     * @return list of all suppliers as DTOs
     */
    public List<SupplierDTO> getAll() {
        return supplierRepository.findAll().stream()
                .map(SupplierMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a specific supplier by its ID.
     *
     * @param id the unique identifier of the supplier
     * @return the supplier DTO
     * @throws NoSuchElementException if supplier is not found
     */
    public SupplierDTO getById(String id) {
        return supplierRepository.findById(id)
                .map(SupplierMapper::toDTO)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found"));
    }

    /**
     * Searches suppliers by name using case-insensitive partial matching.
     *
     * @param name the name (or partial name) to search
     * @return list of matching suppliers
     */
    public List<SupplierDTO> findByName(String name) {
        return supplierRepository.findByNameContainingIgnoreCase(name).stream()
                .map(SupplierMapper::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Creates a new supplier in the system after validating and enforcing name uniqueness.
     *
     * @param dto the supplier data to save
     * @return the persisted supplier as a DTO
     * @throws DuplicateResourceException if supplier with the same name exists
     */
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

    /**
     * Updates an existing supplier if it exists and if the new name is not a duplicate.
     *
     * @param id  the ID of the supplier to update
     * @param dto the new supplier data
     * @return an Optional containing the updated supplier DTO if present
     * @throws DuplicateResourceException if a name conflict occurs
     */
    public Optional<SupplierDTO> update(String id, SupplierDTO dto) {
        SupplierValidator.validateBase(dto);

        return supplierRepository.findById(id)
            .map(existing -> {
                boolean nameChanged = !existing.getName().equalsIgnoreCase(dto.getName());
                if (nameChanged && supplierRepository.existsByNameIgnoreCase(dto.getName())) {
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

    /**
     * Deletes a supplier after verifying it is safe to do so (e.g. no inventory dependency).
     *
     * @param supplierId the ID of the supplier to delete
     * @throws IllegalArgumentException if supplier has related inventory items
     */
    public void delete(String supplierId) {
        SupplierValidator.validateDeletable(supplierId, inventoryItemRepository);
        supplierRepository.deleteById(supplierId);
    }
}
// This code provides the SupplierService class, which manages supplier entities in the system.