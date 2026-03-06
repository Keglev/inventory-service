package com.smartsupplypro.inventory.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.StockHistoryDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.model.StockHistory;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.StockHistoryRepository;

/**
 * Unit tests for {@link StockHistoryService}.
 *
 * <p><strong>Scope</strong>:</p>
 * <ul>
 *   <li>Validate that stock-history events are persisted with correct core fields.</li>
 *   <li>Validate that invalid inputs are rejected and never persisted.</li>
 *   <li>Validate that read/query methods map entities to {@link StockHistoryDTO}s.</li>
 * </ul>
 *
 * <p><strong>Coverage Targets</strong>:</p>
 * <ul>
 *   <li>{@link StockHistoryService#logStockChange(String, int, StockChangeReason, String)}</li>
 *   <li>{@link StockHistoryService#logStockChange(String, int, StockChangeReason, String, BigDecimal)}</li>
 *   <li>{@link StockHistoryService#delete(String, StockChangeReason, String)}</li>
 *   <li>{@link StockHistoryService#getAll()}</li>
 *   <li>{@link StockHistoryService#getByItemId(String)}</li>
 *   <li>{@link StockHistoryService#getByReason(StockChangeReason)}</li>
 *   <li>{@link StockHistoryService#findFiltered(LocalDateTime, LocalDateTime, String, String, Pageable)}</li>
 *   <li>{@link StockHistoryService#save(StockHistoryDTO)}</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong>:</p>
 * <ul>
 *   <li>Negative and positive quantity deltas are both valid for audit trails.</li>
 *   <li>Supplier ID is resolved once and denormalized onto the history record for analytics.</li>
 * </ul>
 */
@SuppressWarnings("unused")
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class StockHistoryServiceTest {

    private static final String ITEM_1 = "item-1";
    private static final String ITEM_2 = "new-id";
    private static final String SUPPLIER_1 = "S1";
    private static final String SUPPLIER_2 = "S2";
    private static final String ADMIN = "admin";

    @Mock
    private StockHistoryRepository repository;

    @Mock
    private InventoryItemRepository itemRepository;

    @InjectMocks
    private StockHistoryService service;

    /**
     * Initializes mock objects before each test case.
     * Sets up default mock behavior for common inventory items.
     */
    @BeforeEach
    void setUp() {
        when(itemRepository.findById(ITEM_1)).thenReturn(Optional.of(mkItem(ITEM_1, SUPPLIER_1)));
        when(itemRepository.findById(ITEM_2)).thenReturn(Optional.of(mkItem(ITEM_2, SUPPLIER_2)));
    }

    private static com.smartsupplypro.inventory.model.InventoryItem mkItem(String id, String supplierId) {
        var it = new com.smartsupplypro.inventory.model.InventoryItem();
        it.setId(id);
        it.setSupplierId(supplierId);
        return it;
    }

    private static StockHistory mkHistory(
            String id,
            String itemId,
            String supplierId,
            int change,
            StockChangeReason reason,
            String createdBy,
            LocalDateTime timestamp,
            BigDecimal priceAtChange) {
        return StockHistory.builder()
                .id(id)
                .itemId(itemId)
                .supplierId(supplierId)
                .change(change)
                .reason(reason)
                .createdBy(createdBy)
                .timestamp(timestamp)
                .priceAtChange(priceAtChange)
                .build();
    }

    private static void assertDto(
            StockHistoryDTO dto,
            String itemId,
            int change,
            StockChangeReason reason,
            String createdBy,
            LocalDateTime timestamp,
            BigDecimal priceAtChange) {
        assertEquals(itemId, dto.getItemId());
        assertEquals(change, dto.getChange());
        assertEquals(reason.name(), dto.getReason());
        assertEquals(createdBy, dto.getCreatedBy());
        assertEquals(timestamp, dto.getTimestamp());
        assertEquals(priceAtChange, dto.getPriceAtChange());
    }

    private StockHistory captureSavedHistory() {
        ArgumentCaptor<StockHistory> captor = ArgumentCaptor.forClass(StockHistory.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }

    /**
     * Tests that a valid stock change log with proper reason, quantity, and metadata
     * is persisted via the repository and all fields are mapped correctly.
     * Scenario: Positive quantity with valid reason.
     * Expected: StockHistory entity saved with all fields set correctly.
     */
    @Test
    void testLogStockChange_withValidReason_shouldSaveStockHistory() {
        // Scenario: valid stock movement event.
        // Expected: entity is persisted with key audit fields populated.
        service.logStockChange(ITEM_1, 10, StockChangeReason.SOLD, ADMIN);

        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(10, saved.getChange());
        assertEquals(StockChangeReason.SOLD, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    /**
     * Validates that an {@link IllegalArgumentException} is thrown
     * when attempting to log stock change with a null reason.
     * Scenario: Reason is null (missing enum value).
     * Expected: {@link IllegalArgumentException} exception and no save operation.
     */
    @Test
    void testLogStockChange_withInvalidReason_shouldThrowException() {
        // Scenario: reason is missing (null).
        // Expected: immediate rejection (enum validation) and no persistence.
        Exception ex = assertThrows(IllegalArgumentException.class,
                () -> service.logStockChange(ITEM_1, 5, null, ADMIN));
        assertTrue(ex.getMessage().contains("Invalid stock change reason"));
    }

    /**
     * Ensures that negative quantity changes (e.g., stock reductions)
     * are allowed and persisted correctly.
     * Scenario: Negative quantity representing item disposal.
     * Expected: StockHistory saved with negative change value.
     */
    @Test
    void testLogStockChange_withNegativeChange_shouldSaveNormally() {
        // Scenario: negative quantity delta (e.g., scrap/sale).
        // Expected: persisted normally; negative delta preserved.
        service.logStockChange(ITEM_1, -5, StockChangeReason.SCRAPPED, ADMIN);

        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(-5, saved.getChange());
        assertEquals(StockChangeReason.SCRAPPED, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    static Stream<Arguments> invalidLogStockChangeCases() {
        BigDecimal price = new BigDecimal("120.00");
        return Stream.of(
                Arguments.of("blank createdBy", ITEM_1, 5, StockChangeReason.MANUAL_UPDATE, "  ", price, "createdby"),
                Arguments.of("null createdBy", ITEM_1, 5, StockChangeReason.MANUAL_UPDATE, null, price, "createdby"),
                Arguments.of("zero change", ITEM_1, 0, StockChangeReason.MANUAL_UPDATE, ADMIN, price, "zero"),
                Arguments.of("null itemId", null, 10, StockChangeReason.MANUAL_UPDATE, ADMIN, price, "item id")
        );
    }

    @ParameterizedTest(name = "logStockChange invalid: {0}")
    @MethodSource("invalidLogStockChangeCases")
    void testLogStockChange_invalidInputs_shouldThrowAndNotPersist(
            String _case,
            String itemId,
            int change,
            StockChangeReason reason,
            String createdBy,
            BigDecimal priceAtChange,
            String expectedMessageContainsLower) {
        // Scenario: validation failures enforced by StockHistoryValidator.
        // Expected: InvalidRequestException + repository.save is never called.
        var ex = assertThrows(InvalidRequestException.class,
                () -> service.logStockChange(itemId, change, reason, createdBy, priceAtChange));
        assertTrue(ex.getMessage().toLowerCase().contains(expectedMessageContainsLower));
        verifyNoInteractions(repository);
    }

    /**
    * Verifies that the `delete` method correctly logs a negative change
    * and persists it via the repository.
    * Scenario: Deleting an item (logs -1 quantity for deletion reason).
    * Expected: StockHistory saved with negative change and deletion reason.
    */
    @Test
    void testDelete_shouldRecordDeletionInStockHistory() {
        // Scenario: legacy deletion convention logs a stock delta of -1.
        // Expected: persisted history record with -1 change and the provided reason.
        service.delete(ITEM_1, StockChangeReason.RETURNED_TO_SUPPLIER, ADMIN);

        StockHistory saved = captureSavedHistory();
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(-1, saved.getChange()); // default for deletions
        assertEquals(StockChangeReason.RETURNED_TO_SUPPLIER, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
    }

    /**
     * Verifies that {@link StockHistoryService#getAll()} maps persisted entities to DTOs.
     * Scenario: repository returns two history rows.
     * Expected: DTO list has same size and key fields mapped (itemId/change/reason/createdBy/timestamp/price).
     */
    @Test
    void testGetAll_shouldMapEntitiesToDTOs() {
        // Scenario: repository returns multiple rows.
        // Expected: service maps entity list to DTO list with stable field mapping.
        LocalDateTime t1 = LocalDateTime.of(2024, 1, 1, 12, 0);
        LocalDateTime t2 = LocalDateTime.of(2024, 1, 2, 12, 0);
        var h1 = mkHistory("sh-1", ITEM_1, SUPPLIER_1, 10, StockChangeReason.SOLD, ADMIN, t1, new BigDecimal("12.50"));
        var h2 = mkHistory("sh-2", ITEM_2, SUPPLIER_2, -5, StockChangeReason.SCRAPPED, "bob", t2, null);

        when(repository.findAll()).thenReturn(List.of(h1, h2));

        List<StockHistoryDTO> out = service.getAll();

        assertEquals(2, out.size());
        assertDto(out.get(0), ITEM_1, 10, StockChangeReason.SOLD, ADMIN, t1, new BigDecimal("12.50"));
        assertDto(out.get(1), ITEM_2, -5, StockChangeReason.SCRAPPED, "bob", t2, null);
    }

    /**
     * Ensures that {@link StockHistoryService#getByItemId(String)} uses the ordered repository method
     * and maps results to DTOs.
     */
    @Test
    void testGetByItemId_shouldDelegateToOrderedFinder_andMapToDTOs() {
        // Scenario: read history for a specific item.
        // Expected: repository ordered finder is used and the result is mapped.
        LocalDateTime t = LocalDateTime.of(2024, 2, 1, 10, 30);
        var h = mkHistory("sh-3", ITEM_1, SUPPLIER_1, 1, StockChangeReason.MANUAL_UPDATE, ADMIN, t, null);
        when(repository.findByItemIdOrderByTimestampDesc(ITEM_1)).thenReturn(List.of(h));

        List<StockHistoryDTO> out = service.getByItemId(ITEM_1);

        assertEquals(1, out.size());
        assertDto(out.get(0), ITEM_1, 1, StockChangeReason.MANUAL_UPDATE, ADMIN, t, null);
    }

    /**
     * Ensures that {@link StockHistoryService#getByReason(StockChangeReason)} uses the ordered repository method
     * and maps results to DTOs.
     */
    @Test
    void testGetByReason_shouldDelegateToOrderedFinder_andMapToDTOs() {
        // Scenario: read history filtered by reason.
        // Expected: repository ordered finder is used and the result is mapped.
        LocalDateTime t = LocalDateTime.of(2024, 3, 1, 9, 0);
        var h = mkHistory("sh-4", ITEM_1, SUPPLIER_1, -2, StockChangeReason.RETURNED_BY_CUSTOMER, ADMIN, t, null);
        when(repository.findByReasonOrderByTimestampDesc(StockChangeReason.RETURNED_BY_CUSTOMER))
                .thenReturn(List.of(h));

        List<StockHistoryDTO> out = service.getByReason(StockChangeReason.RETURNED_BY_CUSTOMER);

        assertEquals(1, out.size());
        assertDto(out.get(0), ITEM_1, -2, StockChangeReason.RETURNED_BY_CUSTOMER, ADMIN, t, null);
    }

    /**
     * Verifies {@link StockHistoryService#findFiltered(LocalDateTime, LocalDateTime, String, String, Pageable)}
     * maps a repository page of entities to a page of DTOs.
     */
    @Test
    void testFindFiltered_shouldMapPageToDTOPage() {
        // Scenario: paginated filter query.
        // Expected: Page<StockHistory> is mapped to Page<StockHistoryDTO>.
        LocalDateTime start = LocalDateTime.of(2024, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2024, 12, 31, 23, 59);
        Pageable pageable = PageRequest.of(0, 10);
        var h = mkHistory(
                "sh-5",
            ITEM_1,
            SUPPLIER_1,
                3,
                StockChangeReason.INITIAL_STOCK,
                "seed",
                LocalDateTime.of(2024, 6, 1, 8, 0),
                new BigDecimal("99.99"));

        Page<StockHistory> page = new PageImpl<>(List.of(h), pageable, 1);
        when(repository.findFiltered(start, end, "Widget", "S1", pageable)).thenReturn(page);

        Page<StockHistoryDTO> out = service.findFiltered(start, end, "Widget", "S1", pageable);

        assertEquals(1, out.getTotalElements());
        assertEquals(1, out.getContent().size());
        StockHistoryDTO dto = out.getContent().get(0);
        assertEquals(ITEM_1, dto.getItemId());
        assertEquals(3, dto.getChange());
        assertEquals(StockChangeReason.INITIAL_STOCK.name(), dto.getReason());
        assertEquals("seed", dto.getCreatedBy());
        assertEquals(new BigDecimal("99.99"), dto.getPriceAtChange());
    }

    /**
     * Verifies that {@link StockHistoryService#save(StockHistoryDTO)} validates the DTO, resolves supplierId,
     * converts reason string to enum, and persists a StockHistory entity.
     */
    @Test
    void testSave_shouldPersistMappedEntity_andResolveSupplierId() {
        // Scenario: service-level save of a validated DTO.
        // Expected: supplierId resolved, reason string converted to enum, entity persisted.
        StockHistoryDTO dto = StockHistoryDTO.builder()
                .itemId(ITEM_1)
                .change(2)
                .reason(StockChangeReason.SOLD.name())
                .createdBy(ADMIN)
                .priceAtChange(new BigDecimal("120.00"))
                .build();

        service.save(dto);

        StockHistory saved = captureSavedHistory();

        assertNotNull(saved.getId());
        assertTrue(saved.getId().startsWith("sh-" + ITEM_1 + "-"));
        assertEquals(ITEM_1, saved.getItemId());
        assertEquals(SUPPLIER_1, saved.getSupplierId());
        assertEquals(2, saved.getChange());
        assertEquals(StockChangeReason.SOLD, saved.getReason());
        assertEquals(ADMIN, saved.getCreatedBy());
        assertNotNull(saved.getTimestamp());
        assertEquals(new BigDecimal("120.00"), saved.getPriceAtChange());
    }
}
