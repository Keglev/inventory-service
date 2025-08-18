package com.smartsupplypro.inventory.service.impl;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.Supplier; // <-- adjust package if your entity lives elsewhere
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.SupplierService;
import com.smartsupplypro.inventory.validation.SupplierValidator;
import com.smartsupplypro.inventory.mapper.SupplierMapper; // static methods used directly
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

/**
 * Default {@link SupplierService} implementation.
 *
 * <p><strong>Responsibilities & Cross-Cutting Concerns</strong>
 * <ul>
 *   <li><em>Validation:</em> Uses {@link SupplierValidator} for base checks, uniqueness,
 *       and deletion preconditions. Exceptions map via GlobalExceptionHandler (400/404/409).</li>
 *   <li><em>Consistency:</em> Server-authoritative IDs & timestamps. Path ID is authoritative for updates.</li>
 *   <li><em>Mapping:</em> Converts between entity and DTO via {@link SupplierMapper}'s <b>static</b> methods.</li>
 *   <li><em>Transactions:</em> Read-only for queries; write transactions for mutations.</li>
 * </ul>
 *
 * <p><strong>Error semantics expected by web layer</strong>
 * <ul>
 *   <li>{@code InvalidRequestException} → 400</li>
 *   <li>{@code DuplicateResourceException} → 409</li>
 *   <li>{@code IllegalStateException} (business conflict) → 409</li>
 *   <li>{@code NoSuchElementException} → 404</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public List<SupplierDTO> findAll() {
        // No filtering here; caller controls access via @PreAuthorize at controller.
        return supplierRepository.findAll().stream()
                .map(SupplierMapper::toDTO) // static call
                .toList();
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public Optional<SupplierDTO> findById(String id) {
        return supplierRepository.findById(id).map(SupplierMapper::toDTO); // static call
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public List<SupplierDTO> findByName(String name) {
        // Repository contract: partial, case-insensitive search.
        return supplierRepository.findByNameContainingIgnoreCase(name).stream()
                .map(SupplierMapper::toDTO) // static call
                .toList();
    }

    /**
     * Create a supplier with server-generated id and timestamp.
     *
     * <p>Preconditions enforced:
     * <ul>
     *   <li>Base DTO validation (non-blank name, etc.).</li>
     *   <li>Uniqueness of name (case-insensitive).</li>
     * </ul>
     *
     * @throws com.smartsupplypro.inventory.exception.InvalidRequestException if payload invalid
     * @throws com.smartsupplypro.inventory.exception.DuplicateResourceException if name not unique
     */
    @Override
    public SupplierDTO create(SupplierDTO dto) {
        SupplierValidator.validateBase(dto);
        SupplierValidator.assertUniqueName(supplierRepository, dto.getName(), null);

        Supplier entity = SupplierMapper.toEntity(dto); // static call
        entity.setId(UUID.randomUUID().toString());
        entity.setCreatedAt(LocalDateTime.now());
        // TO DO(optional): populate createdBy from security context if desired.

        Supplier saved = supplierRepository.save(entity);
        return SupplierMapper.toDTO(saved); // static call
    }

    /**
     * Update mutable fields of an existing supplier.
     *
     * <p>Semantics:
     * <ul>
     *   <li>Path {@code id} is authoritative; if entity missing → 404.</li>
     *   <li>Validates DTO and name uniqueness (excluding current {@code id}).</li>
     *   <li>Maintains server-side audit fields (update timestamp/user) if present in the entity.</li>
     * </ul>
     *
     * @throws NoSuchElementException if supplier does not exist
     * @throws com.smartsupplypro.inventory.exception.InvalidRequestException if payload invalid
     * @throws com.smartsupplypro.inventory.exception.DuplicateResourceException if name conflict
     */
    @Override
    public SupplierDTO update(String id, SupplierDTO dto) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));

        SupplierValidator.validateBase(dto);
        SupplierValidator.assertUniqueName(supplierRepository, dto.getName(), id);

        // Map allowed fields
        existing.setName(dto.getName());
        existing.setContactName(dto.getContactName());
        existing.setPhone(dto.getPhone());
        existing.setEmail(dto.getEmail());

        // NOTE: Your Supplier entity does not expose setUpdatedAt(..).
        // If you later add it, you can uncomment the next line.
        // existing.setUpdatedAt(LocalDateTime.now());

        Supplier saved = supplierRepository.save(existing);
        return SupplierMapper.toDTO(saved); // static call
    }

    /**
     * Delete a supplier after verifying there are no linked inventory items.
     *
     * <p>Preconditions enforced:
     * <ul>
     *   <li>{@code assertDeletable} blocks deletion when items reference the supplier ( → 409 ).</li>
     *   <li>Existence check ( → 404 if missing ).</li>
     * </ul>
     *
     * @throws IllegalStateException if business constraint prevents deletion
     * @throws NoSuchElementException if supplier does not exist
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
}
