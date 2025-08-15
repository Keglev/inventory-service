package com.smartsupplypro.inventory.service.impl;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.StockHistoryService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Final patched version of InventoryItemServiceImplTest covering business rules, validation,
 * supplier checks, and pagination logic. Fully functional with Mockito strictness and correct ID matching.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryItemServiceImplTest {

    @Mock
    private InventoryItemRepository repository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private StockHistoryService stockHistoryService;

    @InjectMocks
    private InventoryItemServiceImpl service;

    private InventoryItemDTO validDto;
    private InventoryItem entity;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    
        // Explicit manual injection
        service = new InventoryItemServiceImpl(
            repository, 
            stockHistoryService, 
            supplierRepository);
    
        validDto = InventoryItemDTO.builder()
                .id("item-1")
                .name("Item 1")
                .price(BigDecimal.valueOf(10.0))
                .quantity(100)
                .minimumQuantity(10)
                .supplierId("supplier-1")
                .createdBy("admin")
                .build();

        entity = InventoryItemMapper.toEntity(validDto);
        entity.setId("item-1");

        when(repository.findById("item-1")).thenReturn(Optional.of(entity));
        when(repository.findByNameIgnoreCase("Item 1")).thenReturn(List.of());
        when(repository.save(any())).thenReturn(entity);
        when(supplierRepository.existsById("supplier-1")).thenReturn(true);
        when(supplierRepository.existsById("supplier-2")).thenReturn(true);

        //  Also mock the pageable query
        Pageable anyPageable = any(Pageable.class);
        Page<InventoryItem> page = new PageImpl<>(List.of(entity, entity));
        when(repository.findByNameSortedByPrice(eq("Test Widget"), anyPageable)).thenReturn(page);
    }

    private void setSecurityContextWithRole(String role) {
        OAuth2User user = mock(OAuth2User.class);
        Authentication authentication = mock(Authentication.class);
        SecurityContext context = mock(SecurityContext.class);

        GrantedAuthority authority = new SimpleGrantedAuthority(role);
        List<GrantedAuthority> authorities = List.of(authority);

        when(user.getAuthorities()).thenAnswer(invocation -> authorities);
        when(authentication.getPrincipal()).thenReturn(user);
        when(context.getAuthentication()).thenReturn(authentication);

        SecurityContextHolder.setContext(context);
    }

    // Convenience aliases
    private void setAdminSecurityContext() {
        setSecurityContextWithRole("ROLE_ADMIN");
    }

    private void setUserSecurityContext() {
        setSecurityContextWithRole("ROLE_USER");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }


    @Test
    void save_shouldReturnSavedItem() {
        when(supplierRepository.existsById("supplier-1")).thenReturn(true);
        when(repository.findByNameIgnoreCase("Item 1")).thenReturn(List.of());
        when(repository.save(any(InventoryItem.class))).thenReturn(entity);

        InventoryItemDTO result = service.save(validDto);

        assertNotNull(result);
        assertEquals("Item 1", result.getName());
        verify(stockHistoryService).logStockChange(eq("item-1"), eq(100), eq(StockChangeReason.INITIAL_STOCK), eq("admin"));
    }

    @Test
    void save_shouldThrow_whenNameIsMissing() {
        validDto.setName(null);
        assertThrows(IllegalArgumentException.class, () -> service.save(validDto));
    }

    @Test
    void update_shouldUpdateAndReturnDTO() {
        // Simulate ADMIN authentication
        setAdminSecurityContext();

        when(repository.save(any())).thenReturn(entity);

        Optional<InventoryItemDTO> updated = service.update("item-1", validDto);

        assertTrue(updated.isPresent());
        assertEquals("Item 1", updated.get().getName());
    }


    @Test
    void update_shouldThrow_whenNotFound() {
        setAdminSecurityContext(); // necessary for security validator

        // Align both values to match the update lookup
        validDto.setId("non-existent-id");

        when(supplierRepository.existsById("supplier-1")).thenReturn(true);
        when(repository.findById("non-existent-id")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
            service.update("non-existent-id", validDto)
        );

        assertEquals("Item not found: non-existent-id", ex.getMessage()); // Optional, for message match
    }

    @Test
    void delete_shouldRemoveItemAndRecordHistory() {
        InventoryItem entity = InventoryItemMapper.toEntity(validDto);
        entity.setId("item-1");
        when(repository.findById("item-1")).thenReturn(Optional.of(entity));

        service.delete("item-1", StockChangeReason.SCRAPPED);

        verify(stockHistoryService).logStockChange(eq("item-1"), eq(-100), eq(StockChangeReason.SCRAPPED), eq("admin"));
        verify(repository).deleteById("item-1");
    }

    @Test
    void delete_shouldThrow_whenItemNotFound() {
        when(repository.findById("missing-id")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.delete("missing-id", StockChangeReason.SCRAPPED));
    }

    @Test
    void findByNameSortedByPrice_shouldReturnPagedResults() {
        Pageable pageable = PageRequest.of(0, 2);
    System.out.println("TEST PAGEABLE: " + pageable);

    InventoryItem item1 = InventoryItem.builder().id("id-1").name("Test Widget").price(BigDecimal.valueOf(5.0)).quantity(10).minimumQuantity(5).supplierId("supplier-1").createdBy("admin").build();
    InventoryItem item2 = InventoryItem.builder().id("id-2").name("Test Widget").price(BigDecimal.valueOf(9.99)).quantity(20).minimumQuantity(5).supplierId("supplier-2").createdBy("admin").build();

    Page<InventoryItem> mockPage = new PageImpl<>(List.of(item1, item2), pageable, 2);

    //  DEBUG: wildcard match instead of strict eq()
    when(repository.findByNameSortedByPrice(eq("Test Widget"), any(Pageable.class))).thenReturn(mockPage);

    Page<InventoryItemDTO> result = service.findByNameSortedByPrice("Test Widget", pageable);

    System.out.println("RESULT PAGE SIZE: " + result.getContent().size());

    assertNotNull(result);
    assertEquals(2, result.getContent().size());
    assertEquals("id-1", result.getContent().get(0).getId());
    assertEquals("id-2", result.getContent().get(1).getId());
    }

    @Test
    void update_shouldSucceed_forUser_whenOnlyQuantityOrPriceChanges() {
        setUserSecurityContext();

        InventoryItemDTO userDto = InventoryItemDTO.builder()
                .id("item-1")
                .name("Item 1") // same as existing
                .price(BigDecimal.valueOf(15.0)) // price changed
                .quantity(120) // quantity changed
                .minimumQuantity(10)
                .supplierId("supplier-1") // same as existing
                .createdBy("user")
                .build();

        when(repository.save(any())).thenReturn(InventoryItemMapper.toEntity(userDto));

        Optional<InventoryItemDTO> updated = service.update("item-1", userDto);

        assertTrue(updated.isPresent());
        assertEquals(BigDecimal.valueOf(15.0), updated.get().getPrice());
        assertEquals(120, updated.get().getQuantity());
    }

    @Test
    void update_shouldFail_forUser_whenChangingNameOrSupplier() {
        setUserSecurityContext();

        InventoryItemDTO userDto = InventoryItemDTO.builder()
                .id("item-1")
                .name("Changed Name") // changed!
                .price(BigDecimal.valueOf(10.0))
                .quantity(100)
                .minimumQuantity(10)
                .supplierId("changed-supplier") // changed!
                .createdBy("user")
                .build();

        when(supplierRepository.existsById("changed-supplier")).thenReturn(true);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                service.update("item-1", userDto)
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertEquals("Users are only allowed to change quantity or price.", ex.getReason());
    }

    // ===== ADD: imports if missing =====
// import org.springframework.web.server.ResponseStatusException;
// import org.springframework.http.HttpStatus;
// import org.springframework.data.domain.PageImpl;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;
// import java.util.Optional;
// import java.math.BigDecimal;
// import static org.mockito.Mockito.*;
// import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.*;

// ===== Helpers if you don’t already have them =====
private InventoryItemDTO dto(String id, String name, String supplierId, int qty, String createdBy) {
    InventoryItemDTO d = new InventoryItemDTO();
    d.setId(id);
    d.setName(name);
    d.setQuantity(qty);
    d.setPrice(new BigDecimal("10.00"));
    d.setSupplierId(supplierId);
    d.setCreatedBy(createdBy);
    return d;
}

private InventoryItem entityFromDto(InventoryItemDTO d) {
    InventoryItem e = new InventoryItem();
    e.setId(d.getId());
    e.setName(d.getName());
    e.setQuantity(d.getQuantity());
    e.setPrice(d.getPrice());
    e.setSupplierId(d.getSupplierId());
    e.setCreatedBy(d.getCreatedBy());
    return e;
}

// ===== 1) save/create: supplier missing -> IllegalArgumentException =====
@Test
void save_supplierDoesNotExist_throwsIllegalArgument() {
    InventoryItemDTO req = dto(null, "New Item", "sup-missing", 5, "admin");
    when(supplierRepository.existsById("sup-missing")).thenReturn(false);

    IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
        () -> service.save(req));

    assertTrue(ex.getMessage() != null && ex.getMessage().toLowerCase().contains("supplier"));
    verify(supplierRepository).existsById("sup-missing");
    verifyNoInteractions(stockHistoryService);
}

// ===== 2) update: supplier missing -> IllegalArgumentException =====
@Test
void update_supplierDoesNotExist_throwsIllegalArgument() {
    InventoryItemDTO req = dto("i-1", "Item A", "sup-missing", 10, "admin");
    when(repository.findById("i-1")).thenReturn(Optional.of(new InventoryItem()));
    when(supplierRepository.existsById("sup-missing")).thenReturn(false);

    IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
        () -> service.update("i-1", req));

    assertTrue(ex.getMessage().toLowerCase().contains("supplier"));
    verify(supplierRepository).existsById("sup-missing");
}

// ===== 3) save: duplicate -> (when you add it) DuplicateResourceException =====
@Test
void save_duplicateName_throwsDuplicateResourceException() {
    // Arrange: simulate repository saying duplicate exists (adapt to your repo API)
    InventoryItemDTO req = dto(null, "Duplicate", "sup-1", 3, "admin");
    when(supplierRepository.existsById("sup-1")).thenReturn(true);
    // Example approaches (pick what your impl uses):
    when(repository.existsByNameIgnoreCase("Duplicate")).thenReturn(true);
    // or: when(repository.findByNameIgnoreCase("Duplicate")).thenReturn(Optional.of(new InventoryItem()));

    // Act + Assert
    com.smartsupplypro.inventory.exception.DuplicateResourceException ex =
        assertThrows(com.smartsupplypro.inventory.exception.DuplicateResourceException.class,
            () -> service.save(req));

    assertTrue(ex.getMessage().toLowerCase().contains("duplicate"));
    verify(repository).existsByNameIgnoreCase("Duplicate");
}

// ===== 4) update: duplicate -> DuplicateResourceException =====
@Test
void update_duplicateName_throwsDuplicateResourceException() {
    InventoryItemDTO req = dto("i-1", "Duplicate", "sup-1", 3, "admin");
    InventoryItem existing = new InventoryItem();
    existing.setId("i-1");
    existing.setName("Old Name");
    existing.setSupplierId("sup-1");

    when(repository.findById("i-1")).thenReturn(Optional.of(existing));
    when(supplierRepository.existsById("sup-1")).thenReturn(true);
    when(repository.existsByNameIgnoreCase("Duplicate")).thenReturn(true);

    com.smartsupplypro.inventory.exception.DuplicateResourceException ex =
        assertThrows(com.smartsupplypro.inventory.exception.DuplicateResourceException.class,
            () -> service.update("i-1", req));

    assertTrue(ex.getMessage().toLowerCase().contains("duplicate"));
    verify(repository).existsByNameIgnoreCase("Duplicate");
}

// ===== 5) delete: logs negative stock ONCE then deletes =====
@Test
void delete_logsHistoryThenDeletes() {
    InventoryItem item = new InventoryItem();
    item.setId("i-1");
    item.setQuantity(7);
    item.setCreatedBy("admin");

    when(repository.findById("i-1")).thenReturn(Optional.of(item));

    service.delete("i-1", com.smartsupplypro.inventory.enums.StockChangeReason.SCRAPPED);

    verify(stockHistoryService, times(1))
        .logStockChange(eq("i-1"), eq(-7), eq(com.smartsupplypro.inventory.enums.StockChangeReason.SCRAPPED), eq("admin"));
    verify(repository, times(1)).deleteById("i-1");
}

// ===== 6) delete: not found -> IllegalArgumentException =====
@Test
void delete_notFound_throwsIllegalArgument() {
    when(repository.findById("missing")).thenReturn(Optional.empty());

    IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
        () -> service.delete("missing", com.smartsupplypro.inventory.enums.StockChangeReason.SCRAPPED));

    assertTrue(ex.getMessage() != null && ex.getMessage().toLowerCase().contains("not found"));
    verify(repository, never()).deleteById(anyString());
    verifyNoInteractions(stockHistoryService);
}

// ===== 7) findByNameSortedByPrice: delegates to repository =====
@Test
void findByNameSortedByPrice_delegatesToRepository() {
    Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
    when(repository.findByNameSortedByPrice("mon", pageable))
        .thenReturn(new PageImpl<>(java.util.List.of(new InventoryItem())));

    service.findByNameSortedByPrice("mon", pageable);

    verify(repository).findByNameSortedByPrice("mon", pageable);
}

// ===== 8) getAll and getById happy/missing =====
@Test
void getAll_returnsMappedDTOs() {
    InventoryItem e1 = entityFromDto(dto("i-1", "A", "sup-1", 1, "admin"));
    InventoryItem e2 = entityFromDto(dto("i-2", "B", "sup-2", 2, "admin"));
    when(repository.findAll()).thenReturn(java.util.List.of(e1, e2));

    java.util.List<InventoryItemDTO> out = service.getAll();

    assertEquals(2, out.size());
    assertEquals("i-1", out.get(0).getId());
}

@Test
void getById_found_returnsDTO() {
    InventoryItem e = entityFromDto(dto("i-1", "A", "sup-1", 1, "admin"));
    when(repository.findById("i-1")).thenReturn(Optional.of(e));

    Optional<InventoryItemDTO> out = service.getById("i-1");

    assertTrue(out.isPresent());
    assertEquals("i-1", out.get().getId());
}

@Test
void getById_missing_returnsEmpty() {
    when(repository.findById("missing")).thenReturn(Optional.empty());
    Optional<InventoryItemDTO> out = service.getById("missing");
    assertTrue(out.isEmpty());
}

// ===== 9) update: optimistic lock surfacing (when you add @Version) =====
@Test
void update_optimisticLock_isSurfaced() {
    InventoryItemDTO req = dto("i-1", "A", "sup-1", 2, "admin");
    when(repository.findById("i-1")).thenReturn(Optional.of(new InventoryItem()));
    when(supplierRepository.existsById("sup-1")).thenReturn(true);

    org.springframework.orm.ObjectOptimisticLockingFailureException ole =
        new org.springframework.orm.ObjectOptimisticLockingFailureException(InventoryItem.class, "i-1");
    when(repository.save(any(InventoryItem.class))).thenThrow(ole);

    org.springframework.orm.ObjectOptimisticLockingFailureException thrown =
        assertThrows(org.springframework.orm.ObjectOptimisticLockingFailureException.class,
            () -> service.update("i-1", req));

    assertSame(ole, thrown);
}


}
