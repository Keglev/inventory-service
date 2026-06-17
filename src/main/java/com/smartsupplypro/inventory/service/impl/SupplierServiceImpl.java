package com.smartsupplypro.inventory.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.mapper.SupplierMapper;
import com.smartsupplypro.inventory.model.Supplier;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.SupplierService;
import com.smartsupplypro.inventory.validation.SupplierValidator;

import lombok.RequiredArgsConstructor;

/**
 * Default implementation of {@link SupplierService} using
 * Spring Data JPA for persistence operations.
 *
 * <p>Validation is delegated to {@link SupplierValidator}. Referential integrity
 * is enforced by checking inventory item references before deletion.</p>
 *
 * @see SupplierService
 * @see SupplierValidator
 * @see SupplierMapper
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final SupplierMapper supplierMapper;

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public List<SupplierDTO> findAll() {
        // No filtering here; caller controls access via @PreAuthorize at controller level
        return supplierRepository.findAll().stream()
                .map(supplierMapper::toDTO)
                .toList();
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public Optional<SupplierDTO> findById(String id) {
        return supplierRepository.findById(id).map(supplierMapper::toDTO);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public List<SupplierDTO> findByName(String name) {
        return supplierRepository.findByNameContainingIgnoreCase(name).stream()
                .map(supplierMapper::toDTO)
                .toList();
    }

    /**
     * {@inheritDoc}
     *
     * <p>ID and createdAt are generated server-side; any client-supplied
     * values in the DTO are ignored.</p>
     */
    @Override
    public SupplierDTO create(SupplierDTO dto) {
        SupplierValidator.validateBase(dto);
        SupplierValidator.assertUniqueName(supplierRepository, dto.getName(), null);

        Supplier entity = supplierMapper.toEntity(dto);
        entity.setId(UUID.randomUUID().toString());
        entity.setCreatedAt(LocalDateTime.now());

        Supplier saved = supplierRepository.save(entity);
        return supplierMapper.toDTO(saved);
    }

    /**
     * {@inheritDoc}
     *
     * <p>The path ID is authoritative; the DTO ID is ignored. Immutable fields
     * (ID, createdAt) are preserved from the existing entity.</p>
     */
    @Override
    public SupplierDTO update(String id, SupplierDTO dto) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));

        SupplierValidator.validateBase(dto);
        // Exclude the current supplier ID so the uniqueness check does not reject its own name
        SupplierValidator.assertUniqueName(supplierRepository, dto.getName(), id);

        existing.setName(dto.getName());
        existing.setContactName(dto.getContactName());
        existing.setPhone(dto.getPhone());
        existing.setEmail(dto.getEmail());

        Supplier saved = supplierRepository.save(existing);
        return supplierMapper.toDTO(saved);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Deletion is blocked if any inventory items (active or historical)
     * reference this supplier, to prevent orphaned stock records.</p>
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

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public long countSuppliers() {
        return supplierRepository.count();
    }
}
