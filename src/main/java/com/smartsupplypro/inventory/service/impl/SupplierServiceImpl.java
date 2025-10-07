package com.smartsupplypro.inventory.service.impl;

import java.time.LocalDateTime;
import java.util.List; // <-- adjust package if your entity lives elsewhere
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // static methods used directly

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.mapper.SupplierMapper;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.SupplierService;
import com.smartsupplypro.inventory.validation.SupplierValidator;

import lombok.RequiredArgsConstructor;

/**
 * Service implementation for supplier master data management.
 *
 * <p><strong>Characteristics</strong>:
 * <ul>
 *   <li><strong>Master Data</strong>: Reference catalog with infrequent changes (&lt;1000 records)</li>
 *   <li><strong>Validation Delegation</strong>: All validation logic in {@link SupplierValidator}</li>
 *   <li><strong>Referential Integrity</strong>: Prevents deletion if inventory items reference supplier</li>
 *   <li><strong>Uniqueness Constraint</strong>: Case-insensitive supplier name enforcement</li>
 *   <li><strong>Static Mapping</strong>: DTO ↔ Entity via {@link SupplierMapper}</li>
 * </ul>
 *
 * <p><strong>Transaction Management</strong>:
 * Class-level {@code @Transactional} with method-level {@code readOnly=true} overrides for query operations.
 *
 * <p><strong>Architecture Documentation</strong>:
 * For detailed operation flows, business rules, design patterns, and refactoring notes, see:
 * <a href="../../../../../../docs/architecture/services/supplier-service.md">Supplier Service Architecture</a>
 *
 * @see SupplierService
 * @see SupplierValidator
 * @see SupplierMapper
 * @see com.smartsupplypro.inventory.model.Supplier
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /**
     * Retrieves all suppliers from the database.
     * 
     * <p>Loads ALL suppliers (acceptable for master data &lt;1000 records).
     * 
     * @return list of all suppliers as DTOs
     * @see <a href="../../../../../../docs/architecture/services/supplier-service.md#operation-flows">Operation Flows</a>
     */
    @Override
    @Transactional(readOnly = true)
    public List<SupplierDTO> findAll() {
        // No filtering here; caller controls access via @PreAuthorize at controller.
        return supplierRepository.findAll().stream()
                .map(SupplierMapper::toDTO) // static call
                .toList();
    }

    /**
     * Finds a supplier by ID.
     * 
     * @param id the supplier ID
     * @return Optional containing supplier if found, empty otherwise
     * @see <a href="../../../../../../docs/architecture/services/supplier-service.md#operation-flows">Operation Flows</a>
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<SupplierDTO> findById(String id) {
        return supplierRepository.findById(id).map(SupplierMapper::toDTO);
    }

    /**
     * Searches suppliers by name (partial match, case-insensitive).
     * 
     * @param name search term (can be partial)
     * @return list of matching suppliers
     * @see <a href="../../../../../../docs/architecture/services/supplier-service.md#operation-flows">Operation Flows</a>
     */
    @Override
    @Transactional(readOnly = true)
    public List<SupplierDTO> findByName(String name) {
        return supplierRepository.findByNameContainingIgnoreCase(name).stream()
                .map(SupplierMapper::toDTO)
                .toList();
    }

    /**
     * Creates a new supplier with validation and server-authoritative field generation.
     *
     * <p><strong>Business Rules</strong>:
     * <ul>
     *   <li>Name must be unique (case-insensitive) → HTTP 409 if conflict</li>
     *   <li>Name and contactName required → HTTP 400 if blank</li>
     *   <li>UUID and createdAt generated server-side (client values ignored)</li>
     * </ul>
     *
     * @param dto the supplier data (client-provided)
     * @return the saved supplier with generated fields
     * @throws com.smartsupplypro.inventory.exception.InvalidRequestException if validation fails → HTTP 400
     * @throws com.smartsupplypro.inventory.exception.DuplicateResourceException if name exists → HTTP 409
     * @see <a href="../../../../../../docs/architecture/services/supplier-service.md#1-create-supplier">Create Supplier Flow</a>
     */
    @Override
    public SupplierDTO create(SupplierDTO dto) {
        SupplierValidator.validateBase(dto);
        SupplierValidator.assertUniqueName(supplierRepository, dto.getName(), null);

        Supplier entity = SupplierMapper.toEntity(dto);
        entity.setId(UUID.randomUUID().toString());
        entity.setCreatedAt(LocalDateTime.now());
        
        // TODO: entity.setCreatedBy(SecurityContextUtils.getCurrentUsername());

        Supplier saved = supplierRepository.save(entity);
        return SupplierMapper.toDTO(saved);
    }

    /**
     * Updates mutable fields of an existing supplier.
     *
     * <p><strong>Business Rules</strong>:
     * <ul>
     *   <li>Path ID authoritative (DTO ID ignored)</li>
     *   <li>Name uniqueness check excludes current supplier</li>
     *   <li>Immutable fields: ID, createdAt</li>
     * </ul>
     *
     * @param id the supplier ID (path parameter, authoritative)
     * @param dto the updated supplier data
     * @return the updated supplier
     * @throws NoSuchElementException if supplier not found → HTTP 404
     * @throws com.smartsupplypro.inventory.exception.InvalidRequestException if validation fails → HTTP 400
     * @throws com.smartsupplypro.inventory.exception.DuplicateResourceException if name conflicts → HTTP 409
     * @see <a href="../../../../../../docs/architecture/services/supplier-service.md#2-update-supplier">Update Supplier Flow</a>
     */
    @Override
    public SupplierDTO update(String id, SupplierDTO dto) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));

        SupplierValidator.validateBase(dto);
        SupplierValidator.assertUniqueName(supplierRepository, dto.getName(), id);

        existing.setName(dto.getName());
        existing.setContactName(dto.getContactName());
        existing.setPhone(dto.getPhone());
        existing.setEmail(dto.getEmail());

        // TODO: existing.setUpdatedAt(LocalDateTime.now());
        // TODO: existing.setUpdatedBy(SecurityContextUtils.getCurrentUsername());

        Supplier saved = supplierRepository.save(existing);
        return SupplierMapper.toDTO(saved);
    }

    /**
     * Deletes a supplier after ensuring no inventory items reference it.
     *
     * <p><strong>Referential Integrity</strong>:
     * Deletion blocked if ANY inventory items (active or historical) reference this supplier.
     *
     * @param id the supplier ID to delete
     * @throws NoSuchElementException if supplier not found → HTTP 404
     * @throws IllegalStateException if inventory items reference supplier → HTTP 409
     * @see <a href="../../../../../../docs/architecture/services/supplier-service.md#3-delete-supplier-referential-integrity">Delete Supplier Flow</a>
     */
    @Override
    public void delete(String id) {
        SupplierValidator.assertDeletable(
            id, 
            () -> inventoryItemRepository.existsActiveStockForSupplier(id, 0)
        );

        if (!supplierRepository.existsById(id)) {
            throw new NoSuchElementException("Supplier not found: " + id);
        }
        
        supplierRepository.deleteById(id);
    }

    /**
     * Returns the total number of suppliers (KPI metric).
     *
     * @return supplier count
     * @see <a href="../../../../../../docs/architecture/services/supplier-service.md#performance-considerations">Performance Considerations</a>
     */
    @Override
    @Transactional(readOnly = true)
    public long countSuppliers() {
        return supplierRepository.count();
    }
}
