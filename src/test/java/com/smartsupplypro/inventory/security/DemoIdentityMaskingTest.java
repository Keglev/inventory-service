package com.smartsupplypro.inventory.security;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.support.StaticListableBeanFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

import com.smartsupplypro.inventory.dto.EmployeeActivityDTO;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link DemoIdentityMasking}: which identities are replaced, how
 * pseudonyms are numbered, which body shapes are covered, and how filters resolve.
 */
class DemoIdentityMaskingTest {

    // Reserved domains (RFC 2606) other than example.com, which is the pseudonym domain and exempt
    private static final String FIRST = "first.person@example.org";
    private static final String SECOND = "second.person@example.net";

    private AppUserRepository repository;
    private DemoIdentityMasking masking;

    private static AppUser account(String email, int day) {
        AppUser u = new AppUser(email, "Name of " + email);
        u.setCreatedAt(LocalDateTime.of(2026, 1, day, 9, 0));
        return u;
    }

    private static ObjectProvider<AppUserRepository> provider(AppUserRepository repository) {
        StaticListableBeanFactory factory = new StaticListableBeanFactory();
        if (repository != null) {
            factory.addBean("appUserRepository", repository);
        }
        return factory.getBeanProvider(AppUserRepository.class);
    }

    private static StockUpdateResultDTO update(String createdBy) {
        return new StockUpdateResultDTO("Item", "Supplier", 1, "SOLD", createdBy,
                LocalDateTime.of(2026, 9, 1, 8, 0));
    }

    private Object write(Object body) {
        return masking.beforeBodyWrite(body, null, null, null, null, null);
    }

    private static void signIn() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                FIRST, "n/a", AuthorityUtils.createAuthorityList("ROLE_ADMIN")));
    }

    @BeforeEach
    void anonymousByDefault() {
        SecurityContextHolder.getContext().setAuthentication(new AnonymousAuthenticationToken(
                "key", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS")));
        repository = Mockito.mock(AppUserRepository.class);
        // SECOND is the newer account although it is listed first
        when(repository.findAll()).thenReturn(List.of(
                account(SECOND, 20), account("ana.ferreira@example.com", 1), account(FIRST, 10)));
        masking = new DemoIdentityMasking(provider(repository));
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    /**
     * What an anonymous caller receives.
     */
    @Nested
    class Responses {

        @Test
        void should_number_real_identities_by_account_creation_when_a_response_also_holds_exempt_values() {
            Object out = write(List.of(update(SECOND), update(FIRST),
                    update("ana.ferreira@example.com"), update("system")));

            assertEquals(List.of("demo-user-2@example.com", "demo-user-1@example.com",
                            "ana.ferreira@example.com", "system"),
                    ((List<?>) out).stream().map(r -> ((StockUpdateResultDTO) r).createdBy()).toList());
        }

        @Test
        void should_mask_the_identity_when_its_case_differs_from_the_account() {
            StockUpdateResultDTO out = (StockUpdateResultDTO) write(update("First.Person@Example.ORG"));

            assertEquals("demo-user-1@example.com", out.createdBy());
        }

        @Test
        void should_replace_the_display_name_only_when_the_identity_is_masked() {
            List<?> out = (List<?>) write(List.of(
                    new EmployeeActivityDTO("2026-09", FIRST, "Real Name", 3),
                    new EmployeeActivityDTO("2026-09", "ana.ferreira@example.com", "Ana Ferreira", 2)));

            assertEquals(new EmployeeActivityDTO("2026-09", "demo-user-1@example.com", "Demo-Nutzer 1", 3),
                    out.get(0));
            assertEquals(new EmployeeActivityDTO("2026-09", "ana.ferreira@example.com", "Ana Ferreira", 2),
                    out.get(1));
        }

        @Test
        void should_mask_every_identity_when_the_body_is_a_page_an_item_or_a_supplier() {
            Page<?> page = (Page<?>) write(new PageImpl<>(List.of(update(FIRST))));
            InventoryItemDTO item = InventoryItemDTO.builder().name("Item").createdBy(SECOND).build();
            SupplierDTO supplier = SupplierDTO.builder().name("Supplier").createdBy(FIRST).build();

            assertEquals("demo-user-1@example.com", ((StockUpdateResultDTO) page.getContent().get(0)).createdBy());
            assertEquals("demo-user-2@example.com", ((InventoryItemDTO) write(item)).getCreatedBy());
            assertEquals("demo-user-1@example.com", ((SupplierDTO) write(supplier)).getCreatedBy());
        }

        @Test
        void should_use_the_unnumbered_pseudonym_when_the_identity_has_no_account() {
            List<?> out = (List<?>) write(List.of(new EmployeeActivityDTO("2026-09", "gone@example.org", "Gone", 1)));

            assertEquals(new EmployeeActivityDTO("2026-09", "demo-user@example.com", "Demo-Nutzer", 1), out.get(0));
        }

        @Test
        void should_fail_closed_when_the_user_table_is_not_available() {
            masking = new DemoIdentityMasking(provider(null));

            assertEquals("demo-user@example.com", ((StockUpdateResultDTO) write(update(FIRST))).createdBy());
        }

        @Test
        void should_read_the_user_table_once_when_a_response_repeats_identities() {
            write(List.of(update(FIRST), update(SECOND), update(FIRST)));

            verify(repository, times(1)).findAll();
        }

        @Test
        void should_leave_the_body_untouched_when_the_caller_is_signed_in() {
            signIn();
            StockUpdateResultDTO row = update(FIRST);

            assertSame(row, write(row));
        }
    }

    /**
     * How a {@code createdBy} filter is translated.
     */
    @Nested
    class Filters {

        @Test
        void should_resolve_the_address_when_the_filter_is_a_known_pseudonym() {
            assertEquals(SECOND, masking.resolveFilter("Demo-User-2@Example.com"));
        }

        @Test
        void should_return_no_match_when_an_anonymous_caller_filters_by_a_real_address() {
            assertEquals(DemoIdentityMasking.NO_MATCH, masking.resolveFilter(FIRST));
        }

        @Test
        void should_return_no_match_when_the_pseudonym_is_unknown_or_malformed() {
            assertEquals(DemoIdentityMasking.NO_MATCH, masking.resolveFilter("demo-user-3@example.com"));
            assertEquals(DemoIdentityMasking.NO_MATCH, masking.resolveFilter("demo-user-0@example.com"));
            assertEquals(DemoIdentityMasking.NO_MATCH, masking.resolveFilter("demo-user-x@example.com"));
            assertEquals(DemoIdentityMasking.NO_MATCH, masking.resolveFilter("demo-user-1@example.org"));
            assertEquals(DemoIdentityMasking.NO_MATCH, masking.resolveFilter("demo-user-"));
        }

        @Test
        void should_pass_the_filter_unchanged_when_it_is_exempt_or_empty() {
            assertEquals("ana.ferreira@example.com", masking.resolveFilter("ana.ferreira@example.com"));
            assertEquals("system", masking.resolveFilter("system"));
            assertEquals("  ", masking.resolveFilter("  "));
            assertNull(masking.resolveFilter(null));
        }

        @Test
        void should_pass_any_filter_unchanged_when_the_caller_is_signed_in() {
            signIn();

            assertEquals(FIRST, masking.resolveFilter(FIRST));
        }
    }
}
