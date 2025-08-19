package com.smartsupplypro.inventory.repository.custom;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.smartsupplypro.inventory.dto.StockEventRowDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.model.StockHistory;

import jakarta.persistence.EntityManager;

/**
 * Slice tests for {@link StockHistoryCustomRepositoryImpl}.
 *
 * <p>Focuses on the JPQL projection method {@code findEventsUpTo}, which feeds the WAC algorithm.
 * Verifies supplier filtering and ordering by (itemId ASC, createdAt ASC).</p>
 */
@DataJpaTest
@ActiveProfiles("test")
@Import(StockHistoryCustomRepositoryImpl.class)
class StockHistoryCustomRepositoryImplTest {

    @Autowired private EntityManager em;
    @Autowired private StockHistoryCustomRepository customRepo;

    @Test
    void findEventsUpTo_ordersByItemThenTime_andFiltersBySupplier() {
        // Two items across two suppliers; only sup1 should be returned.
        persist(sh("itemA", "sup1",
                at(2024,2,1, 9,0),  +5, bd("4.00"), StockChangeReason.INITIAL_STOCK));
        persist(sh("itemA", "sup1",
                at(2024,2,1,10,0),  -2, null,       StockChangeReason.SOLD));
        persist(sh("itemB", "sup1",
                at(2024,2,2,10,0),  +3, bd("5.50"), StockChangeReason.INITIAL_STOCK));
        persist(sh("itemA", "sup2",
                at(2024,2,1,11,0),  +1, bd("6.00"), StockChangeReason.INITIAL_STOCK)); // different supplier

        em.flush(); em.clear();

        LocalDateTime endInclusive = at(2024,2,28,23,59);
        List<StockEventRowDTO> out = customRepo.findEventsUpTo(endInclusive, "sup1");

        // Expect only sup1 records, ordered by itemId then createdAt.
        assertEquals(3, out.size());
        assertEquals("sup1", out.get(0).supplierId());
        assertEquals("sup1", out.get(1).supplierId());
        assertEquals("sup1", out.get(2).supplierId());

        // Order: itemA (09:00), itemA (10:00), itemB (10:00 next day)
        assertEquals("itemA", out.get(0).itemId());
        assertEquals(at(2024,2,1, 9,0), out.get(0).createdAt());
        assertEquals(+5, out.get(0).quantityChange());

        assertEquals("itemA", out.get(1).itemId());
        assertEquals(at(2024,2,1,10,0), out.get(1).createdAt());
        assertEquals(-2, out.get(1).quantityChange());

        assertEquals("itemB", out.get(2).itemId());
        assertEquals(at(2024,2,2,10,0), out.get(2).createdAt());
        assertEquals(+3, out.get(2).quantityChange());
    }

    // ---- helpers ----------------------------------------------------------

    private static LocalDateTime at(int y,int m,int d,int H,int M) {
        return LocalDateTime.of(y, m, d, H, M);
    }

    private static BigDecimal bd(String v) {
        return new BigDecimal(v);
    }

    private void persist(StockHistory sh) {
        em.persist(sh);
    }

    private static StockHistory sh(String itemId, String supplierId,
                                   LocalDateTime createdAt,
                                   int quantityChange,
                                   BigDecimal priceAtChange,
                                   StockChangeReason reason) {
        StockHistory e = new StockHistory();
        e.setId(UUID.randomUUID().toString());
        e.setItemId(itemId);
        e.setSupplierId(supplierId);
        e.setTimestamp(createdAt);
        e.setChange(quantityChange);
        e.setPriceAtChange(priceAtChange);
        e.setReason(reason);
        // set other non-null fields if your entity requires them (e.g., createdBy)
        return e;
    }
}

