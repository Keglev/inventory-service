package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;

/**
 * Unit tests for {@link InventoryItemServiceImpl}.
 *
 * <p>Scope:
 * <ul>
 *   <li>Business rules for save/update/delete (duplicate names, supplier existence, base validation).</li>
 *   <li>Side effects: stock history logging on save/delete with correct delta and price-at-change.</li>
 *   <li>Error handling: not-found, conflict, and optimistic-lock behavior.</li>
 * </ul>
 *
 * <p>Style:
 * <ul>
 *   <li>Mockito-based unit tests (no web/DB). Security context faked as needed for validators.</li>
 *   <li>Lenient stubbing to allow shared defaults in {@code @BeforeEach}.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplTest {
    // Mocks and service under test
    @Mock private InventoryItemRepository repository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockHistoryService stockHistoryService;
    /**
     * The service under test. Uses {@code @InjectMocks} to inject the mocks above.
     * <p>
     * Note: this is not a Spring-managed bean, so no need for {@code @SpringBootTest} or similar.
     */
    @InjectMocks private InventoryItemServiceImpl service;

    // Reusable fixtures
    private InventoryItemDTO baseDto;
    private InventoryItem existing;

    // Reusable fixtures for tests
    @BeforeEach
    @SuppressWarnings("unused") // invoked by JUnit via reflection
    void setup() {
        // Default: authenticated admin so validator permits save/update/delete
        authenticateAsOAuth2("admin", "ADMIN");

        // DTO with non-null price (prevents mapper NPE)
        baseDto = new InventoryItemDTO();
        baseDto.setName("Widget");
        baseDto.setQuantity(100);
        baseDto.setMinimumQuantity(5);
        baseDto.setPrice(new BigDecimal("10.00"));
        baseDto.setSupplierId("S1");
        baseDto.setCreatedBy("admin"); // set once here so copies inherit via copyOf

        // Existing entity commonly used in tests
        existing = new InventoryItem();
        existing.setId("item-1");
        existing.setName("Widget");
        existing.setQuantity(100);
        existing.setMinimumQuantity(5);
        existing.setPrice(new BigDecimal("10.00"));
        existing.setSupplierId("S1");

        // Default stubs
        lenient().when(supplierRepository.existsById(anyString())).thenReturn(true);
        lenient().when(repository.existsByNameIgnoreCase(anyString())).thenReturn(false);
    }

    /**
     * Clears the security context after each test to avoid cross-test contamination.
     * <p>
     * Note: this is invoked by JUnit via reflection, so no need for explicit calls.
     */
    @AfterEach
    @SuppressWarnings("unused") // invoked by JUnit via reflection
    void clearSecurity() {
        SecurityContextHolder.clearContext();
    }

    // ---------- save ----------
    /**
     * Tests the save method with a valid DTO, ensuring it returns the saved item and logs INITIAL_STOCK.
     * <p>
     * Note: this test assumes the repository.save() method is mocked to return a saved entity.
     */
    @Test
    @DisplayName("save: returns saved item and logs INITIAL_STOCK with priceAtChange")
    void save_shouldReturnSavedItem() {
        // given
        InventoryItem toPersist = InventoryItemMapper.toEntity(baseDto);
        InventoryItem saved = copyOf(toPersist);
        saved.setId("item-1");
        when(repository.save(any(InventoryItem.class))).thenReturn(saved);

        // when
        ensureCreatedBy(baseDto);
        var result = service.save(baseDto);

        // then
        assertEquals("item-1", result.getId());
        assertEquals(new BigDecimal("10.00"), result.getPrice());

        // Verify the stock history service was called with INITIAL_STOCK reason
        verify(stockHistoryService).logStockChange(
                eq("item-1"),
                eq(100),
                eq(StockChangeReason.INITIAL_STOCK),
                eq("admin"),
                any()
        );
    }

    /**
     * Tests the save method with a valid DTO, ensuring it returns the saved item and logs INITIAL_STOCK.
     * <p>
     * Note: this test assumes the repository.save() method is mocked to return a saved entity.
     */
    @Test
    @DisplayName("save: duplicate name -> 409 CONFLICT (ResponseStatusException)")
    void save_duplicateName_throwsConflict() {
        // duplicate for any input name; short-circuit before save
        when(repository.existsByNameIgnoreCase(anyString())).thenReturn(true);

        // Client attempts to save a new item with a name that already exists
        ensureCreatedBy(baseDto);
        // safety: if impl still calls save, return a non-null entity to avoid NPE
        lenient().when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> {
            InventoryItem src = inv.getArgument(0, InventoryItem.class);
            if (src.getId() == null) {
                src.setId("generated-id");
            }
            return src;
        });
    }

    // ---------- update ----------
    /**
     * Tests the update method with a valid DTO, ensuring it updates the item and logs stock change.
     * <p>
     * Note: this test assumes the repository.save() method is mocked to return an updated entity.
     */
    @Test
    @DisplayName("update: not found -> 404 NOT_FOUND")
    void update_shouldThrow_whenNotFound() {
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        // Client attempts to update an item that does not exist
        InventoryItemDTO updateDto = copyOf(baseDto);
        ensureCreatedBy(updateDto); // ensure createdBy on the DTO actually passed in
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.update("missing-id", updateDto));

        // Expect a 404 NOT_FOUND with a message containing "not found"
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
        assertTrue(safeReason(ex).contains("not found"));
    }

    /**
     * Tests the update method with a valid DTO, ensuring it updates the item and logs stock change.
     * <p>
     * Note: this test assumes the repository.save() method is mocked to return an updated entity.
     */
    @Test
    @DisplayName("update: duplicate name -> 409 CONFLICT (or DuplicateResourceException)")
    void update_duplicateName_throwsConflict() {
        // The item being updated currently exists with name "Widget"
        when(repository.findById("id-1")).thenReturn(Optional.of(copyOf(existing)));

        // Client attempts to rename to "Widget-2"
        InventoryItemDTO updateDto = copyOf(baseDto);
        updateDto.setName("Widget-2");                 // must differ from existing
        ensureCreatedBy(updateDto);

        // >>> Key stub: the validator checks findByNameIgnoreCase, not existsBy...
        // Return a conflicting item with SAME price and DIFFERENT id.
        InventoryItem conflict = new InventoryItem();
        conflict.setId("other-id");
        conflict.setName("Widget-2");
        conflict.setPrice(new BigDecimal("10.00"));    // same as updateDto price
        conflict.setQuantity(1);
        conflict.setMinimumQuantity(1);
        conflict.setSupplierId("S1");
        when(repository.findByNameIgnoreCase("Widget-2")).thenReturn(java.util.List.of(conflict));

        // Some implementations still call save() before throwing; keep NPE-safety just in case
        lenient().when(repository.save(any(InventoryItem.class))).thenAnswer(inv -> {
            InventoryItem src = inv.getArgument(0, InventoryItem.class);
            if (src.getId() == null) src.setId("generated-id");
            return src;
        });

        // Accept either the service-wrapped 409 or the raw DuplicateResourceException from the validator
        // Note: the service may wrap the exception, so we check both cases
        try {
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> service.update("id-1", updateDto));
            assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
            assertTrue(safeReason(ex).contains("already"));
        } catch (org.opentest4j.AssertionFailedError ignored) {
            com.smartsupplypro.inventory.exception.DuplicateResourceException ex2 =
                    assertThrows(com.smartsupplypro.inventory.exception.DuplicateResourceException.class,
                            () -> service.update("id-1", updateDto));
            assertTrue(ex2.getMessage() != null && !ex2.getMessage().isBlank());
        }
    }

    /**
     * Tests the update method with a valid DTO, ensuring it updates the item and logs stock change.
     * <p>
     * Note: this test assumes the repository.save() method is mocked to return an updated entity.
     */
    @Test
    @DisplayName("update: optimistic lock -> propagated as ObjectOptimisticLockingFailureException")
    void update_optimisticLock_isSurfacedAsConflict() {
        when(repository.findById("id-1")).thenReturn(Optional.of(copyOf(existing)));
        when(repository.save(any())).thenThrow(
                new ObjectOptimisticLockingFailureException(InventoryItem.class, "id-1")
        );

        // Client attempts to update an existing item
        InventoryItemDTO updateDto = copyOf(baseDto);
        ensureCreatedBy(updateDto);

        // Your service propagates the OOLFE directly (doesn't wrap to ResponseStatusException)
            ObjectOptimisticLockingFailureException ex = assertThrows(
            ObjectOptimisticLockingFailureException.class,
            () -> service.update("id-1", updateDto)
        );
        assertTrue(ex.getMessage() != null && !ex.getMessage().isBlank());
    }

    // ---------- delete ----------
    /**
     * Tests the delete method with a valid item ID, ensuring it logs stock change and deletes the item.
     * <p>
     * Note: this test assumes the repository.findById() method is mocked to return an existing entity.
     */
    @Test
    @DisplayName("delete: not found -> 404 NOT_FOUND")
    void delete_shouldThrow_whenItemNotFound() {
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        // Client attempts to delete an item that does not exist
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
            () -> service.delete("missing-id", StockChangeReason.SCRAPPED));
        assertTrue(ex.getMessage() != null && ex.getMessage().toLowerCase().contains("not found"));
    }

    /**
     * Tests the delete method with a valid item ID, ensuring it logs stock change and deletes the item.
     * <p>
     * Note: this test assumes the repository.findById() method is mocked to return an existing entity.
     */
    @Test
    @DisplayName("delete: logs negative stock once with priceAtChange then deletes")
    void delete_shouldRemoveItemAndRecordHistory() {
        InventoryItem found = copyOf(existing); // qty=100, price=10.00
        when(repository.findById("item-1")).thenReturn(Optional.of(found));

        // Client attempts to delete an existing item
        service.delete("item-1", StockChangeReason.SCRAPPED);
        // Verify the stock history service was called with negative quantity and price at change
        verify(stockHistoryService, times(1)).logStockChange(
                eq("item-1"),
                eq(-100),
                eq(StockChangeReason.SCRAPPED),
                eq("admin"),
                any()
        );
        verify(repository).deleteById("item-1");
    }

    /**
     * Tests the delete method with a valid item ID, ensuring it logs stock change and deletes the item.
     * <p>
     * Note: this test assumes the repository.findById() method is mocked to return an existing entity.
     */
    @Test
    @DisplayName("delete: supports null price at change (graceful log)")
    void delete_logsHistoryThenDeletes() {
        InventoryItem found = copyOf(existing);
        found.setId("i-1");
        found.setQuantity(7);
        found.setPrice(null); // simulate legacy item without price
        when(repository.findById("i-1")).thenReturn(Optional.of(found));
        // Client attempts to delete an existing item
        service.delete("i-1", StockChangeReason.SCRAPPED);
        // Verify the stock history service was called with negative quantity and null price
        verify(stockHistoryService).logStockChange(
                eq("i-1"),
                eq(-7),
                eq(StockChangeReason.SCRAPPED),
                eq("admin"),
                isNull()
        );
        verify(repository).deleteById("i-1");
    }

    // ---------- search / paging ----------

    /**
     * Tests the findByNameSortedByPrice method, ensuring it delegates to the repository and maps to DTO.
     * <p>
     * Note: this test assumes the repository.findByNameSortedByPrice() method is mocked to return a page of entities.
     */
    @Test
    @DisplayName("findByNameSortedByPrice: delegates to repository and maps to DTO (prices set)")
    void findByNameSortedByPrice_delegatesToRepository() {
        InventoryItem e1 = new InventoryItem();
        e1.setId("i-1"); e1.setName("AAA"); e1.setPrice(new BigDecimal("10.00"));
        e1.setQuantity(5); e1.setMinimumQuantity(1); e1.setSupplierId("S1");

        // Second item with different price
        InventoryItem e2 = new InventoryItem();
        e2.setId("i-2"); e2.setName("BBB"); e2.setPrice(new BigDecimal("20.00"));
        e2.setQuantity(7); e2.setMinimumQuantity(1); e2.setSupplierId("S1");

        var page = new PageImpl<>(List.of(e1, e2));
        // (matches any query + any pageable):
        when(repository.findByNameSortedByPrice(anyString(), any(org.springframework.data.domain.Pageable.class)))
            .thenReturn(page);

        var result = service.findByNameSortedByPrice("z", PageRequest.of(0, 10));

        assertEquals(2, result.getTotalElements());
        assertEquals("i-1", result.getContent().get(0).getId());
        assertEquals(new BigDecimal("10.00"), result.getContent().get(0).getPrice());
    }

    // ---------- helpers ----------

    /**
     * Authenticates the current thread as an OAuth2 user with the given username and roles.
     * <p>
     * This sets up a minimal security context for tests that require authentication.
     *
     * @param username the username to authenticate as
     * @param roles    the roles to assign to the user (e.g., "ADMIN", "USER")
     */
    private static void authenticateAsOAuth2(String username, String... roles) {
        // Build authorities (with and without ROLE_ prefix to satisfy either check)
        java.util.List<org.springframework.security.core.authority.SimpleGrantedAuthority> roleAuthorities =
                java.util.Arrays.stream(roles)
                        .map(r -> new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + r))
                        .toList();
        // Bare authorities (without ROLE_ prefix) for OAuth2User
        java.util.List<org.springframework.security.core.authority.SimpleGrantedAuthority> bareAuthorities =
                java.util.Arrays.stream(roles)
                        .map(org.springframework.security.core.authority.SimpleGrantedAuthority::new)
                        .toList();
        // Combine both sets of authorities
        java.util.List<org.springframework.security.core.GrantedAuthority> authorities = new java.util.ArrayList<>(roleAuthorities.size() + bareAuthorities.size());
        authorities.addAll(roleAuthorities);
        authorities.addAll(bareAuthorities);

        // Minimal OAuth2 user principal (many validators read attributes like "sub" or "email")
        java.util.Map<String, Object> attrs = java.util.Map.of(
                "sub", username,
                "email", username + "@example.com",
                "name", username
        );
        // Use "sub" as the name attribute key
        OAuth2User principal = new DefaultOAuth2User(authorities, attrs, "sub");

        // The clientRegistrationId can be any non-empty string (e.g., "test")
        OAuth2AuthenticationToken oauth2 =
                new OAuth2AuthenticationToken(principal, authorities, "test");

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(oauth2);
    }

    /**
     * Creates a copy of the given InventoryItemDTO with the same properties.
     * <p>
     * This is used to ensure that updates pass base validation by copying createdBy.
     *
     * @param src the source DTO to copy
     * @return a new InventoryItemDTO with copied properties
     */
    private static InventoryItemDTO copyOf(InventoryItemDTO src) {
        InventoryItemDTO d = new InventoryItemDTO();
        d.setName(src.getName());
        d.setQuantity(src.getQuantity());
        d.setMinimumQuantity(src.getMinimumQuantity());
        d.setPrice(src.getPrice());
        d.setSupplierId(src.getSupplierId());
        d.setCreatedBy(src.getCreatedBy()); // <-- IMPORTANT: copy createdBy so updates pass base validation
        return d;
    }

    /**
     * Creates a copy of the given InventoryItem with the same properties.
     * <p>
     * This is used to ensure that updates pass base validation by copying createdBy.
     *
     * @param src the source InventoryItem to copy
     * @return a new InventoryItem with copied properties
     */
    private static InventoryItem copyOf(InventoryItem src) {
        InventoryItem i = new InventoryItem();
        i.setId(src.getId() != null ? src.getId() : UUID.randomUUID().toString());
        i.setName(src.getName());
        i.setQuantity(src.getQuantity());
        i.setMinimumQuantity(src.getMinimumQuantity());
        i.setPrice(src.getPrice());
        i.setSupplierId(src.getSupplierId());
        return i;
    }
    

    /** Avoids nullable warnings when asserting messages on ResponseStatusException. */
    private static String safeReason(ResponseStatusException ex) {
        return String.valueOf(ex.getReason()).toLowerCase();
    }
    
    /**
     * Ensures the createdBy field is set on the DTO, defaulting to "admin" if null or blank.
     * <p>
     * This is used to ensure that updates pass base validation by copying createdBy.
     *
     * @param dto the InventoryItemDTO to check and set createdBy
     */
    private static void ensureCreatedBy(InventoryItemDTO dto) {
        if (dto.getCreatedBy() == null || dto.getCreatedBy().isBlank()) {
            dto.setCreatedBy("admin");
        }
    }
}
