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
 * Implementation of {@link SupplierService} providing supplier lifecycle management
 * with comprehensive validation, referential integrity checks, and audit trail support.
 *
 * <h2>Overview</h2>
 * <p>
 * This service manages the complete lifecycle of supplier entities, ensuring data integrity,
 * business rule enforcement, and proper coordination with dependent inventory items. Unlike
 * {@link InventoryItemServiceImpl} which manages items with audit trails, this service focuses
 * on supplier master data management with strict referential integrity constraints.
 * </p>
 *
 * <h2>Core Responsibilities</h2>
 * <ul>
 *   <li><strong>CRUD Operations</strong>: Create, read, update, delete suppliers with validation</li>
 *   <li><strong>Uniqueness Enforcement</strong>: Supplier name must be unique (case-insensitive)</li>
 *   <li><strong>Referential Integrity</strong>: Prevent deletion if inventory items reference supplier</li>
 *   <li><strong>Master Data Validation</strong>: Ensure valid contact information (phone, email)</li>
 *   <li><strong>Search Capabilities</strong>: Name-based partial matching (case-insensitive)</li>
 *   <li><strong>Audit Fields</strong>: Server-side generation of IDs and timestamps</li>
 * </ul>
 *
 * <h2>Key Features</h2>
 *
 * <h3>1. Validation Strategy (Delegated Pattern)</h3>
 * <p>
 * All validation logic is centralized in {@link SupplierValidator} static utility:
 * <ul>
 *   <li><strong>{@code validateBase()}</strong>: Field-level validation
 *     <ul>
 *       <li>Name: Non-blank, reasonable length</li>
 *       <li>Contact Name: Non-blank</li>
 *       <li>Phone: Valid format (optional, depends on validator impl)</li>
 *       <li>Email: Valid format (optional, depends on validator impl)</li>
 *     </ul>
 *   </li>
 *   <li><strong>{@code assertUniqueName()}</strong>: Uniqueness check
 *     <ul>
 *       <li>Case-insensitive name matching</li>
 *       <li>Excludes current supplier ID on updates</li>
 *       <li>Throws {@code DuplicateResourceException} on conflict → HTTP 409</li>
 *     </ul>
 *   </li>
 *   <li><strong>{@code assertDeletable()}</strong>: Business constraint check
 *     <ul>
 *       <li>Prevents deletion if inventory items reference supplier</li>
 *       <li>Uses {@code existsActiveStockForSupplier()} query</li>
 *       <li>Throws {@code IllegalStateException} on constraint violation → HTTP 409</li>
 *     </ul>
 *   </li>
 * </ul>
 * <strong>Benefits</strong>: Centralized rules, reusable across layers, testable in isolation
 * </p>
 *
 * <h3>2. Referential Integrity Enforcement</h3>
 * <p>
 * Suppliers are referenced by inventory items via {@code supplierId} foreign key.
 * This service enforces referential integrity at the service layer:
 * <ul>
 *   <li><strong>On Deletion</strong>: Checks {@code inventoryItemRepository.existsActiveStockForSupplier()}
 *     <ul>
 *       <li>If ANY inventory items reference supplier → deletion blocked</li>
 *       <li>Error message: "Cannot delete supplier with existing inventory items"</li>
 *       <li>Alternative: Implement soft delete (isActive flag) or cascade strategy</li>
 *     </ul>
 *   </li>
 *   <li><strong>On Update</strong>: Name change allowed even with linked items
 *     <ul>
 *       <li>Items automatically see updated supplier name via relationship</li>
 *       <li>No orphaned references possible</li>
 *     </ul>
 *   </li>
 * </ul>
 * <strong>Business Rule</strong>: Cannot delete suppliers in active use (prevents data integrity issues)
 * </p>
 *
 * <h3>3. Uniqueness Constraint (Case-Insensitive)</h3>
 * <p>
 * Supplier names must be unique regardless of case:
 * <ul>
 *   <li>"ACME Corp" and "acme corp" are considered duplicates</li>
 *   <li>Enforced at service layer (before database)</li>
 *   <li>Repository uses {@code findByNameContainingIgnoreCase()} for searching</li>
 *   <li>Validator uses case-insensitive comparison</li>
 * </ul>
 * <strong>Why Service Layer?</strong> Provides clear error messages and prevents database constraint violations
 * </p>
 *
 * <h3>4. Static Mapper Pattern</h3>
 * <p>
 * This service uses {@link SupplierMapper} with <strong>static methods</strong> for conversion:
 * <pre>
 * SupplierDTO dto = SupplierMapper.toDTO(entity);   // Entity → DTO
 * Supplier entity = SupplierMapper.toEntity(dto);   // DTO → Entity
 * </pre>
 * <strong>Comparison with Other Services</strong>:
 * <ul>
 *   <li>{@link InventoryItemServiceImpl}: Uses {@code InventoryItemMapper} (also static)</li>
 *   <li>Consistent pattern across all services</li>
 *   <li>Alternative: MapStruct or instance-based mappers (future refactoring option)</li>
 * </ul>
 * </p>
 *
 * <h3>5. Transaction Management</h3>
 * <p>
 * Class-level {@code @Transactional} with method-level overrides:
 * <ul>
 *   <li><strong>Read Operations</strong>: {@code @Transactional(readOnly = true)} for optimization
 *     <ul>
 *       <li>{@code findAll()}, {@code findById()}, {@code findByName()}, {@code countSuppliers()}</li>
 *       <li>Allows database read-only optimizations (no dirty checking)</li>
 *     </ul>
 *   </li>
 *   <li><strong>Write Operations</strong>: Default {@code @Transactional} (read-write)
 *     <ul>
 *       <li>{@code create()}, {@code update()}, {@code delete()}</li>
 *       <li>Atomicity: Validation + persistence (all-or-nothing)</li>
 *       <li>Rollback on any exception</li>
 *     </ul>
 *   </li>
 * </ul>
 * </p>
 *
 * <h3>6. Server-Authoritative Fields</h3>
 * <p>
 * Similar to {@link InventoryItemServiceImpl}, server controls critical fields:
 * <ul>
 *   <li><strong>ID</strong>: UUID generated on creation (client-provided IDs ignored)</li>
 *   <li><strong>createdAt</strong>: Timestamp set on creation (LocalDateTime.now())</li>
 *   <li><strong>updatedAt</strong>: <em>(Not currently implemented)</em>
 *     <ul>
 *       <li>Entity class doesn't expose {@code setUpdatedAt()}</li>
 *       <li>Future enhancement: Add {@code updatedAt} field + JPA @PreUpdate listener</li>
 *       <li>See refactoring analysis for AuditFieldListener pattern</li>
 *     </ul>
 *   </li>
 *   <li><strong>createdBy</strong>: <em>(TODO)</em>
 *     <ul>
 *       <li>Comment notes: "populate createdBy from security context if desired"</li>
 *       <li>Future enhancement: Use SecurityContextUtils.getCurrentUsername()</li>
 *       <li>See {@link InventoryItemServiceImpl#currentUsername()} for pattern</li>
 *     </ul>
 *   </li>
 * </ul>
 * </p>
 *
 * <h2>Business Rules Enforced</h2>
 * <ol>
 *   <li><strong>Unique Name</strong>: No two suppliers can have the same name (case-insensitive)</li>
 *   <li><strong>Deletion Protection</strong>: Cannot delete suppliers with linked inventory items</li>
 *   <li><strong>Required Fields</strong>: Name and contact name must be non-blank</li>
 *   <li><strong>Path ID Authoritative</strong>: On update, path ID takes precedence over DTO ID</li>
 *   <li><strong>Server-Side Timestamps</strong>: Creation timestamp always set by server</li>
 * </ol>
 *
 * <h2>Error Handling & HTTP Status Mapping</h2>
 * <p>
 * Exception types map to HTTP status codes via GlobalExceptionHandler:
 * </p>
 * <table border="1">
 *   <tr>
 *     <th>Exception Type</th>
 *     <th>HTTP Status</th>
 *     <th>Scenario</th>
 *   </tr>
 *   <tr>
 *     <td>{@code InvalidRequestException}</td>
 *     <td>400 Bad Request</td>
 *     <td>Invalid DTO fields (blank name, invalid email, etc.)</td>
 *   </tr>
 *   <tr>
 *     <td>{@code NoSuchElementException}</td>
 *     <td>404 Not Found</td>
 *     <td>Supplier ID doesn't exist (update/delete)</td>
 *   </tr>
 *   <tr>
 *     <td>{@code DuplicateResourceException}</td>
 *     <td>409 Conflict</td>
 *     <td>Supplier name already exists</td>
 *   </tr>
 *   <tr>
 *     <td>{@code IllegalStateException}</td>
 *     <td>409 Conflict</td>
 *     <td>Cannot delete supplier with linked items</td>
 *   </tr>
 * </table>
 *
 * <h2>Performance Considerations</h2>
 * <ul>
 *   <li><strong>{@code findAll()}</strong>: Loads ALL suppliers (acceptable for master data, typically &lt; 1000 records)</li>
 *   <li><strong>{@code findByName()}</strong>: Uses {@code LIKE %name%} query (index on name recommended)</li>
 *   <li><strong>{@code existsActiveStockForSupplier()}</strong>: Custom repository query (should use index on supplierId)</li>
 *   <li><strong>Read-Only Transactions</strong>: Optimization hint for database (no dirty checking)</li>
 * </ul>
 *
 * <h2>Comparison with InventoryItemServiceImpl</h2>
 * <table border="1">
 *   <tr>
 *     <th>Aspect</th>
 *     <th>SupplierServiceImpl</th>
 *     <th>InventoryItemServiceImpl</th>
 *   </tr>
 *   <tr>
 *     <td>Audit Trail</td>
 *     <td>Minimal (timestamps only)</td>
 *     <td>Comprehensive (StockHistory integration)</td>
 *   </tr>
 *   <tr>
 *     <td>Validation</td>
 *     <td>Static utility (SupplierValidator)</td>
 *     <td>Static utilities (InventoryItemValidator + SecurityValidator)</td>
 *   </tr>
 *   <tr>
 *     <td>Referential Integrity</td>
 *     <td>Enforced (prevent deletion)</td>
 *     <td>Enforced (supplier must exist)</td>
 *   </tr>
 *   <tr>
 *     <td>Security Context</td>
 *     <td>TODO (not yet implemented)</td>
 *     <td>Fully integrated (currentUsername())</td>
 *   </tr>
 *   <tr>
 *     <td>Complexity</td>
 *     <td>MEDIUM (152 lines)</td>
 *     <td>HIGH (1092 lines)</td>
 *   </tr>
 *   <tr>
 *     <td>Master Data</td>
 *     <td>Yes (suppliers are reference data)</td>
 *     <td>No (items are transactional data)</td>
 *   </tr>
 * </table>
 *
 * <h2>Related Components</h2>
 * <ul>
 *   <li>{@link SupplierService} - Service interface defining contract</li>
 *   <li>{@link SupplierValidator} - Validation logic (static utilities)</li>
 *   <li>{@link SupplierRepository} - Data access layer</li>
 *   <li>{@link SupplierMapper} - Entity/DTO conversion (static methods)</li>
 *   <li>{@link InventoryItemRepository} - Used for referential integrity checks</li>
 *   <li>{@link InventoryItemServiceImpl} - Consumes supplier data</li>
 * </ul>
 *
 * <h2>Future Refactoring Considerations</h2>
 * <p>
 * See {@code docs/backend/SUPPLIERSERVICEIMPL_REFACTORING_ANALYSIS.md} for:
 * <ul>
 *   <li>SecurityContextUtils integration (createdBy/updatedBy population)</li>
 *   <li>AuditFieldListener pattern (automatic timestamp management)</li>
 *   <li>Soft delete implementation (isActive flag vs hard delete)</li>
 *   <li>Pagination support for findAll() (if supplier count grows &gt; 1000)</li>
 *   <li>Cross-service validation patterns (shared with InventoryItemServiceImpl)</li>
 * </ul>
 * </p>
 *
 * @see SupplierService
 * @see SupplierValidator
 * @see SupplierRepository
 * @see SupplierMapper
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final InventoryItemRepository inventoryItemRepository;

    /**
     * {@inheritDoc}
     * 
     * <p><strong>Performance Note</strong>: This method loads ALL suppliers into memory.
     * For most applications, supplier count remains manageable (&lt; 1000 records) as they
     * represent master/reference data, not transactional data.</p>
     * 
     * <p><strong>Use Cases</strong>:</p>
     * <ul>
     *   <li>Admin dashboard showing complete supplier list</li>
     *   <li>Dropdown menus for supplier selection (if count is reasonable)</li>
     *   <li>Export functionality (CSV/Excel generation)</li>
     *   <li>Bulk operations requiring all suppliers</li>
     * </ul>
     * 
     * <p><strong>Security</strong>: Access control enforced at controller layer via
     * {@code @PreAuthorize} annotations. This method performs no filtering.</p>
     * 
     * <p><strong>Future Enhancement</strong>: If supplier count grows &gt; 1000, consider:
     * <ul>
     *   <li>Adding pagination support (Page&lt;SupplierDTO&gt; findAll(Pageable))</li>
     *   <li>Implementing caching (suppliers change infrequently)</li>
     *   <li>Lazy loading strategies</li>
     * </ul>
     * </p>
     *
     * @return list of all suppliers as DTOs (typically small dataset)
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
     * {@inheritDoc}
     * 
     * <p>Returns {@link Optional#empty()} if supplier not found, allowing caller
     * to handle absence gracefully (e.g., return 404 HTTP status).</p>
     * 
     * <p><strong>Use Cases</strong>:</p>
     * <ul>
     *   <li>View supplier details page</li>
     *   <li>Pre-populate edit forms</li>
     *   <li>Validate supplier existence before linking to inventory item</li>
     * </ul>
     *
     * @param id the unique identifier of the supplier
     * @return Optional containing the supplier DTO if found, empty otherwise
     */
    @Override
    @Transactional(readOnly = true)
    public Optional<SupplierDTO> findById(String id) {
        return supplierRepository.findById(id).map(SupplierMapper::toDTO); // static call
    }

    /**
     * {@inheritDoc}
     * 
     * <p><strong>Search Behavior</strong>:</p>
     * <ul>
     *   <li><strong>Partial Match</strong>: Uses SQL {@code LIKE %name%} pattern</li>
     *   <li><strong>Case-Insensitive</strong>: "ACME", "acme", "Acme" all match</li>
     *   <li><strong>Substring Matching</strong>: "corp" matches "ACME Corporation", "TechCorp", "CorpSystems"</li>
     *   <li><strong>Empty String</strong>: Returns all suppliers (same as findAll)</li>
     * </ul>
     * 
     * <p><strong>Use Cases</strong>:</p>
     * <ul>
     *   <li>Search bar autocomplete in UI</li>
     *   <li>Filtering supplier dropdown by typing</li>
     *   <li>Supplier lookup by partial name</li>
     * </ul>
     * 
     * <p><strong>Performance</strong>: Consider adding database index on supplier name
     * column for faster wildcard searches.</p>
     *
     * @param name the search term for supplier name (partial match, case-insensitive)
     * @return list of matching suppliers, empty list if no matches
     */
    @Override
    @Transactional(readOnly = true)
    public List<SupplierDTO> findByName(String name) {
        // Repository contract: partial, case-insensitive search.
        return supplierRepository.findByNameContainingIgnoreCase(name).stream()
                .map(SupplierMapper::toDTO) // static call
                .toList();
    }

    /**
     * Creates a new supplier with server-generated ID and timestamp.
     *
     * <p><strong>Operation Flow</strong>:</p>
     * <ol>
     *   <li>Validate DTO fields (non-blank name, valid email/phone format)</li>
     *   <li>Check name uniqueness (case-insensitive across all suppliers)</li>
     *   <li>Convert DTO to entity</li>
     *   <li>Generate server-side fields (ID, createdAt)</li>
     *   <li>Persist to database</li>
     *   <li>Return saved entity as DTO</li>
     * </ol>
     * 
     * <p><strong>Business Rules Applied</strong>:</p>
     * <ul>
     *   <li><strong>Unique Name</strong>: No duplicate supplier names (case-insensitive)
     *     <ul>
     *       <li>"ACME Corp" and "acme corp" are considered duplicates</li>
     *       <li>Throws {@code DuplicateResourceException} → HTTP 409 Conflict</li>
     *     </ul>
     *   </li>
     *   <li><strong>Required Fields</strong>: Name and contact name must be non-blank</li>
     *   <li><strong>Server-Authoritative ID</strong>: UUID generated regardless of client input</li>
     *   <li><strong>Server-Authoritative Timestamp</strong>: createdAt set to current time</li>
     * </ul>
     * 
     * <p><strong>Validation Delegation</strong>:</p>
     * <p>All validation logic is centralized in {@link SupplierValidator}:
     * <ul>
     *   <li>{@code validateBase(dto)}: Field-level validation (non-blank, format checks)</li>
     *   <li>{@code assertUniqueName(repo, name, null)}: Uniqueness check (null = new supplier)</li>
     * </ul>
     * This promotes code reuse and makes validation rules testable in isolation.
     * </p>
     * 
     * <p><strong>Audit Trail (Current State)</strong>:</p>
     * <ul>
     *   <li>✅ {@code createdAt}: Automatically set to {@code LocalDateTime.now()}</li>
     *   <li>⏸️ {@code createdBy}: TODO - Not yet implemented
     *     <ul>
     *       <li>Future enhancement: Use {@code SecurityContextUtils.getCurrentUsername()}</li>
     *       <li>See {@link InventoryItemServiceImpl#currentUsername()} for pattern</li>
     *       <li>Requires SecurityContextUtils extraction (see refactoring analysis)</li>
     *     </ul>
     *   </li>
     * </ul>
     * 
     * <p><strong>Transaction Boundary</strong>:</p>
     * <p>Validation and persistence occur within a single transaction. If validation fails,
     * no database operation is attempted (fail-fast). If persistence fails, validation
     * results are discarded (atomicity guarantee).</p>
     * 
     * <p><strong>Example Usage</strong>:</p>
     * <pre>
     * SupplierDTO newSupplier = new SupplierDTO();
     * newSupplier.setName("ACME Corporation");
     * newSupplier.setContactName("John Smith");
     * newSupplier.setPhone("+1-555-0123");
     * newSupplier.setEmail("john.smith@acme.com");
     * 
     * SupplierDTO saved = service.create(newSupplier);
     * // Result: Supplier persisted with UUID and timestamp
     * </pre>
     *
     * @param dto the supplier data transfer object (client-provided)
     * @return the saved supplier as DTO with server-generated fields
     * @throws com.smartsupplypro.inventory.exception.InvalidRequestException if DTO validation fails (blank name, invalid email, etc.) → HTTP 400
     * @throws com.smartsupplypro.inventory.exception.DuplicateResourceException if supplier name already exists (case-insensitive) → HTTP 409
     */
    @Override
    public SupplierDTO create(SupplierDTO dto) {
        // ===== STEP 1: Validate DTO fields =====
        // Checks: non-blank name, non-blank contact name, valid email/phone format
        SupplierValidator.validateBase(dto);
        
        // ===== STEP 2: Check name uniqueness =====
        // Business rule: Supplier name must be unique (case-insensitive)
        // null parameter = new supplier (no ID to exclude from search)
        SupplierValidator.assertUniqueName(supplierRepository, dto.getName(), null);

        // ===== STEP 3: Convert DTO to entity =====
        Supplier entity = SupplierMapper.toEntity(dto); // static call
        
        // ===== STEP 4: Generate server-side fields =====
        // ID: Always generate new UUID (client-provided ID ignored)
        entity.setId(UUID.randomUUID().toString());
        
        // createdAt: Set to current timestamp
        entity.setCreatedAt(LocalDateTime.now());
        
        // TODO (Future Enhancement): Populate createdBy from security context
        // entity.setCreatedBy(SecurityContextUtils.getCurrentUsername());
        // Requires SecurityContextUtils extraction (see refactoring analysis)

        // ===== STEP 5: Persist to database =====
        Supplier saved = supplierRepository.save(entity);
        
        // ===== STEP 6: Return saved entity as DTO =====
        return SupplierMapper.toDTO(saved); // static call
    }

    /**
     * Updates mutable fields of an existing supplier.
     *
     * <p><strong>Operation Flow</strong>:</p>
     * <ol>
     *   <li>Verify supplier exists (throws 404 if not found)</li>
     *   <li>Validate DTO fields (non-blank, format checks)</li>
     *   <li>Check name uniqueness (excluding current supplier)</li>
     *   <li>Map allowed fields from DTO to entity</li>
     *   <li>Update audit timestamp (if entity supports it)</li>
     *   <li>Persist changes to database</li>
     *   <li>Return updated entity as DTO</li>
     * </ol>
     * 
     * <p><strong>Business Rules Applied</strong>:</p>
     * <ul>
     *   <li><strong>Path ID Authoritative</strong>: Path parameter {@code id} is authoritative
     *     <ul>
     *       <li>DTO ID (if provided) is ignored</li>
     *       <li>Prevents ID confusion/manipulation</li>
     *       <li>Standard REST practice (PUT /api/suppliers/{id})</li>
     *     </ul>
     *   </li>
     *   <li><strong>Uniqueness Check (Conditional)</strong>: Name uniqueness validated ONLY if name changed
     *     <ul>
     *       <li>Current supplier ID excluded from uniqueness search</li>
     *       <li>Example: Can update "ACME Corp" → "ACME Corporation" if no conflict</li>
     *       <li>{@code assertUniqueName(repo, newName, currentId)}</li>
     *     </ul>
     *   </li>
     *   <li><strong>Immutable Fields</strong>: ID and createdAt are never overwritten
     *     <ul>
     *       <li>ID: Determined by path parameter</li>
     *       <li>createdAt: Preserved from original entity</li>
     *     </ul>
     *   </li>
     *   <li><strong>Referential Integrity Preserved</strong>: Linked inventory items automatically see updated supplier name</li>
     * </ul>
     * 
     * <p><strong>Mutable Fields</strong>:</p>
     * <ul>
     *   <li>{@code name}: Supplier display name (subject to uniqueness constraint)</li>
     *   <li>{@code contactName}: Primary contact person name</li>
     *   <li>{@code phone}: Contact phone number (format validated by SupplierValidator)</li>
     *   <li>{@code email}: Contact email address (format validated by SupplierValidator)</li>
     * </ul>
     * 
     * <p><strong>Audit Trail (Current State)</strong>:</p>
     * <ul>
     *   <li>⏸️ {@code updatedAt}: NOT YET IMPLEMENTED
     *     <ul>
     *       <li>Entity class {@link Supplier} does not expose {@code setUpdatedAt()} method</li>
     *       <li>Future enhancement: Add {@code updatedAt} field to entity</li>
     *       <li>Uncomment line: {@code existing.setUpdatedAt(LocalDateTime.now());}</li>
     *       <li>Alternative: Implement JPA @PreUpdate listener (see AuditFieldListener pattern)</li>
     *     </ul>
     *   </li>
     *   <li>⏸️ {@code updatedBy}: NOT YET IMPLEMENTED
     *     <ul>
     *       <li>Future enhancement: Use {@code SecurityContextUtils.getCurrentUsername()}</li>
     *       <li>Track who made the last modification (compliance requirement)</li>
     *     </ul>
     *   </li>
     * </ul>
     * 
     * <p><strong>Impact on Linked Inventory Items</strong>:</p>
     * <p>When a supplier name is updated:
     * <ul>
     *   <li>✅ Inventory items referencing this supplier automatically see the new name</li>
     *   <li>✅ No orphaned references (referential integrity maintained)</li>
     *   <li>✅ No cascade update needed (foreign key relationship)</li>
     *   <li>⚠️ Analytics reports using cached data may show stale supplier names until cache refresh</li>
     * </ul>
     * </p>
     * 
     * <p><strong>Transaction Boundary</strong>:</p>
     * <p>All validations and database update occur atomically. If validation fails,
     * no changes are persisted. If persistence fails, all changes are rolled back.</p>
     * 
     * <p><strong>Example Usage</strong>:</p>
     * <pre>
     * // Scenario 1: Update supplier contact info
     * SupplierDTO updates = existingSupplier.clone();
     * updates.setContactName("Jane Doe");
     * updates.setPhone("+1-555-9999");
     * service.update(supplierId, updates);
     * // Result: Contact updated, name unchanged, no uniqueness check needed
     * 
     * // Scenario 2: Rename supplier (requires uniqueness check)
     * SupplierDTO rename = existingSupplier.clone();
     * rename.setName("ACME Corporation Ltd");
     * service.update(supplierId, rename);
     * // Result: Name updated if unique, DuplicateResourceException if conflict
     * 
     * // Scenario 3: Invalid supplier ID
     * try {
     *     service.update("invalid-id", updates);
     * } catch (NoSuchElementException e) {
     *     // "Supplier not found: invalid-id" → HTTP 404
     * }
     * </pre>
     *
     * @param id the unique identifier of the supplier to update (path parameter, authoritative)
     * @param dto the updated supplier data (ID field ignored if present)
     * @return the updated supplier as DTO
     * @throws NoSuchElementException if supplier with given ID does not exist → HTTP 404
     * @throws com.smartsupplypro.inventory.exception.InvalidRequestException if DTO validation fails → HTTP 400
     * @throws com.smartsupplypro.inventory.exception.DuplicateResourceException if name conflicts with another supplier → HTTP 409
     */
    @Override
    public SupplierDTO update(String id, SupplierDTO dto) {
        // ===== STEP 1: Verify supplier exists =====
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Supplier not found: " + id));

        // ===== STEP 2: Validate DTO fields =====
        SupplierValidator.validateBase(dto);
        
        // ===== STEP 3: Check name uniqueness (excluding current supplier) =====
        // Business rule: Name must be unique, but allow same supplier to keep same name
        // The 'id' parameter excludes this supplier from the uniqueness search
        SupplierValidator.assertUniqueName(supplierRepository, dto.getName(), id);

        // ===== STEP 4: Map allowed fields from DTO to entity =====
        existing.setName(dto.getName());
        existing.setContactName(dto.getContactName());
        existing.setPhone(dto.getPhone());
        existing.setEmail(dto.getEmail());

        // ===== STEP 5: Update audit timestamp (if entity supports it) =====
        // NOTE: Your Supplier entity does not expose setUpdatedAt(..) method.
        // Future enhancement: Add updatedAt field + uncomment below
        // existing.setUpdatedAt(LocalDateTime.now());
        
        // TODO (Future Enhancement): Track who made the update
        // existing.setUpdatedBy(SecurityContextUtils.getCurrentUsername());

        // ===== STEP 6: Persist changes to database =====
        Supplier saved = supplierRepository.save(existing);
        
        // ===== STEP 7: Return updated entity as DTO =====
        return SupplierMapper.toDTO(saved); // static call
    }

    /**
     * Deletes a supplier after ensuring referential integrity.
     *
     * <p><strong>Operation Flow</strong>:</p>
     * <ol>
     *   <li>Check referential integrity (throws 409 if linked items exist)</li>
     *   <li>Verify supplier exists (throws 404 if not found)</li>
     *   <li>Delete supplier from database</li>
     * </ol>
     * 
     * <p><strong>Referential Integrity Enforcement</strong>:</p>
     * <p><strong>⚠️ CRITICAL BUSINESS RULE</strong>: A supplier <strong>CANNOT</strong> be deleted if any inventory
     * items currently reference it. This prevents orphaned foreign keys and maintains
     * data consistency.</p>
     * 
     * <p><strong>Deletion Blocked Scenarios</strong>:</p>
     * <ul>
     *   <li>❌ <strong>Active Stock</strong>: Inventory items with quantity > 0 linked to this supplier
     *     <ul>
     *       <li>Example: Supplier "ACME Corp" has 50 laptops in stock</li>
     *       <li>Action required: Transfer items to another supplier OR deplete stock first</li>
     *     </ul>
     *   </li>
     *   <li>❌ <strong>Depleted Stock (Historical Records)</strong>: Items with quantity = 0 but supplier link preserved
     *     <ul>
     *       <li>Example: Supplier "Obsolete Inc" has 0 laptops now, but historical records exist</li>
     *       <li>Reason: Audit trail requires preserving supplier relationship</li>
     *       <li>Action required: Change item's supplier reference OR consider soft delete</li>
     *     </ul>
     *   </li>
     *   <li>✅ <strong>No Linked Items</strong>: Supplier never referenced OR all items deleted first
     *     <ul>
     *       <li>Example: Supplier "New Vendor" never had items assigned</li>
     *       <li>Result: Deletion proceeds successfully</li>
     *     </ul>
     *   </li>
     * </ul>
     * 
     * <p><strong>Validation Query Explained</strong>:</p>
     * <p>The {@code assertDeletable(..)} method executes:
     * <pre>
     * // Custom query from InventoryItemRepository
     * SELECT COUNT(*) FROM inventory_items WHERE supplier_id = ? AND quantity > ?
     * // threshold = 0, so matches ANY items (active OR historical)
     * </pre>
     * If count > 0 → {@link IllegalStateException} (mapped to HTTP 409 by controller)
     * </p>
     * 
     * <p><strong>Alternative Deletion Strategies (Not Implemented)</strong>:</p>
     * <ul>
     *   <li>💡 <strong>Soft Delete</strong> (Recommended for compliance):
     *     <ul>
     *       <li>Add {@code deletedAt} timestamp field to {@link Supplier} entity</li>
     *       <li>Hide deleted suppliers from {@code findAll()} via filter</li>
     *       <li>Preserve historical data for audits/reports</li>
     *     </ul>
     *   </li>
     *   <li>💡 <strong>Cascade Nullify</strong> (Use with caution):
     *     <ul>
     *       <li>Set {@code supplier_id = NULL} on linked inventory items</li>
     *       <li>Risk: Loses historical supplier association</li>
     *       <li>Use case: Anonymous/generic suppliers</li>
     *     </ul>
     *   </li>
     *   <li>⚠️ <strong>Cascade Delete</strong> (Not recommended):
     *     <ul>
     *       <li>Automatically delete linked inventory items</li>
     *       <li>Dangerous: Unintentional data loss</li>
     *       <li>Never appropriate for supplier-item relationship</li>
     *     </ul>
     *   </li>
     * </ul>
     * 
     * <p><strong>Transaction Boundary</strong>:</p>
     * <p>Referential integrity check and deletion occur atomically. If validation
     * passes but deletion fails (e.g., concurrent modification), changes are rolled back.</p>
     * 
     * <p><strong>Example Usage</strong>:</p>
     * <pre>
     * // Scenario 1: Successful deletion (no linked items)
     * String supplierId = "never-used-supplier-id";
     * service.delete(supplierId);
     * // Result: Supplier deleted successfully
     * 
     * // Scenario 2: Deletion blocked (linked active stock)
     * String activeSupplier = "acme-corp-id";
     * try {
     *     service.delete(activeSupplier);
     * } catch (IllegalStateException e) {
     *     // "Cannot delete supplier: inventory items still reference it" → HTTP 409
     *     // UI should show: "Transfer items to another supplier before deletion"
     * }
     * 
     * // Scenario 3: Invalid supplier ID
     * try {
     *     service.delete("non-existent-id");
     * } catch (NoSuchElementException e) {
     *     // "Supplier not found: non-existent-id" → HTTP 404
     * }
     * 
     * // Scenario 4: Deletion blocked (historical records)
     * String historicalSupplier = "obsolete-supplier-id";
     * try {
     *     service.delete(historicalSupplier);
     * } catch (IllegalStateException e) {
     *     // "Cannot delete supplier: inventory items still reference it" → HTTP 409
     *     // All items have quantity=0, but supplier link preserved for audit
     *     // UI should show: "Change supplier on items OR consider archiving supplier"
     * }
     * </pre>
     *
     * @param id the unique identifier of the supplier to delete
     * @throws IllegalStateException if inventory items reference this supplier → HTTP 409
     * @throws NoSuchElementException if supplier with given ID does not exist → HTTP 404
     */
    @Override
    public void delete(String id) {
        // ===== STEP 1: Check referential integrity =====
        // Validation throws IllegalStateException if any inventory items link to this supplier
        // Lambda provides custom query: existsActiveStockForSupplier(supplierId, threshold=0)
        // threshold=0 means check for ANY items (active stock + historical records)
        SupplierValidator.assertDeletable(
            id, 
            () -> inventoryItemRepository.existsActiveStockForSupplier(id, 0)
        );

        // ===== STEP 2: Verify supplier exists =====
        if (!supplierRepository.existsById(id)) {
            throw new NoSuchElementException("Supplier not found: " + id);
        }
        
        // ===== STEP 3: Delete supplier from database =====
        // Safe to proceed: No foreign key constraints will be violated
        supplierRepository.deleteById(id);
    }

    /**
     * Returns the total number of suppliers in the system (KPI metric).
     *
     * <p><strong>Purpose</strong>:</p>
     * <p>This method provides a key performance indicator (KPI) for the supplier management
     * system. It is used in dashboard displays, analytics reports, and monitoring to
     * track the growth and size of the supplier network.</p>
     * 
     * <p><strong>Use Cases</strong>:</p>
     * <ul>
     *   <li><strong>Dashboard KPI Tile</strong>:
     *     <ul>
     *       <li>Display total supplier count alongside other metrics (total items, total stock value)</li>
     *       <li>Example: "Suppliers: 87" on admin dashboard</li>
     *     </ul>
     *   </li>
     *   <li><strong>Analytics Reports</strong>:
     *     <ul>
     *       <li>Supplier diversity analysis (how many suppliers provide inventory)</li>
     *       <li>Risk assessment (over-reliance on single supplier if count is low)</li>
     *     </ul>
     *   </li>
     *   <li><strong>Pagination UI</strong>:
     *     <ul>
     *       <li>Determine total pages for supplier list (totalPages = ceil(count / pageSize))</li>
     *       <li>Show "Displaying 1-25 of 87 suppliers"</li>
     *     </ul>
     *   </li>
     *   <li><strong>Capacity Planning</strong>:
     *     <ul>
     *       <li>Monitor supplier network growth over time</li>
     *       <li>Decide when to implement pagination (if count exceeds 1000)</li>
     *     </ul>
     *   </li>
     * </ul>
     * 
     * <p><strong>Performance Characteristics</strong>:</p>
     * <ul>
     *   <li><strong>Query Type</strong>: {@code SELECT COUNT(*) FROM suppliers}
     *     <ul>
     *       <li>Lightweight database operation (no row data fetched)</li>
     *       <li>Typically &lt;10ms execution time even for thousands of records</li>
     *     </ul>
     *   </li>
     *   <li><strong>Caching Opportunity</strong>:
     *     <ul>
     *       <li>Master data changes infrequently (new suppliers added rarely)</li>
     *       <li>Consider caching result for 1-5 minutes to reduce DB load</li>
     *       <li>Invalidate cache on create/update/delete operations</li>
     *     </ul>
     *   </li>
     * </ul>
     * 
     * <p><strong>Comparison with {@code countItems()} in {@link InventoryItemServiceImpl}</strong>:</p>
     * <table border="1" cellpadding="5">
     *   <tr>
     *     <th>Aspect</th>
     *     <th>{@code countSuppliers()} (this method)</th>
     *     <th>{@code countItems()}</th>
     *   </tr>
     *   <tr>
     *     <td><strong>Data Type</strong></td>
     *     <td>Master data (reference)</td>
     *     <td>Transactional data</td>
     *   </tr>
     *   <tr>
     *     <td><strong>Change Frequency</strong></td>
     *     <td>Low (monthly/quarterly)</td>
     *     <td>High (daily/hourly)</td>
     *   </tr>
     *   <tr>
     *     <td><strong>Typical Count</strong></td>
     *     <td>10-500 suppliers</td>
     *     <td>100-10,000+ items</td>
     *   </tr>
     *   <tr>
     *     <td><strong>Caching Strategy</strong></td>
     *     <td>High potential (5-minute cache)</td>
     *     <td>Low potential (real-time accuracy needed)</td>
     *   </tr>
     * </table>
     * 
     * <p><strong>Transaction Behavior</strong>:</p>
     * <p>Marked {@code @Transactional(readOnly = true)} for performance optimization:
     * <ul>
     *   <li>✅ No write lock acquired (concurrent reads allowed)</li>
     *   <li>✅ Database can optimize read-only query</li>
     *   <li>✅ Reduced transaction overhead</li>
     * </ul>
     * </p>
     * 
     * <p><strong>Example Usage</strong>:</p>
     * <pre>
     * // Dashboard KPI display
     * long supplierCount = service.countSuppliers();
     * System.out.println("Total Suppliers: " + supplierCount);
     * // Output: "Total Suppliers: 87"
     * 
     * // Pagination calculation
     * int pageSize = 25;
     * long totalSuppliers = service.countSuppliers();
     * int totalPages = (int) Math.ceil((double) totalSuppliers / pageSize);
     * // Result: 87 suppliers ÷ 25 per page = 4 pages
     * 
     * // Risk assessment
     * if (supplierCount &lt; 3) {
     *     System.out.println("WARNING: Over-reliance on few suppliers (risk: single point of failure)");
     * }
     * </pre>
     *
     * @return the total number of suppliers in the database
     */
    @Override
    @Transactional(readOnly = true)
    public long countSuppliers() {
        return supplierRepository.count();
    }
}
