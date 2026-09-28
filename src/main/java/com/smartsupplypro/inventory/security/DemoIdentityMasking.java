package com.smartsupplypro.inventory.security;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.MethodParameter;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.authentication.AuthenticationTrustResolver;
import org.springframework.security.authentication.AuthenticationTrustResolverImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import com.smartsupplypro.inventory.dto.EmployeeActivityDTO;
import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.dto.StockUpdateResultDTO;
import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Keeps real identities out of what anonymous demo callers receive.
 *
 * <p>The read-only demo admits anonymous requests, and audit fields carry the
 * e-mail of whoever made a change. For an anonymous caller every identity is
 * replaced by a pseudonym before the body is written; signed-in callers see the
 * real values. Two kinds of value are not a person and pass unchanged: addresses
 * at {@code example.com} (reserved for examples by RFC 2606, used by the seeded
 * demo users) and values without an {@code @}, such as {@code system}.</p>
 *
 * <p>A pseudonym is {@code demo-user-N@example.com}, shown as "Demo-Nutzer N".
 * N numbers the non-exempt accounts by creation time, so one person keeps one
 * pseudonym across endpoints and requests. An identity with no account, or any
 * identity when the user table is not available, becomes the unnumbered
 * "Demo-Nutzer": the masking fails closed.</p>
 *
 * <p>Filters work the other way: an anonymous {@code createdBy} filter may name
 * an exempt value or a pseudonym, never a real address, so a caller cannot probe
 * whether an address exists.</p>
 */
@RestControllerAdvice
public class DemoIdentityMasking implements ResponseBodyAdvice<Object> {

    static final String DOMAIN = "@example.com";
    static final String PREFIX = "demo-user-";
    static final String FALLBACK_ADDRESS = "demo-user" + DOMAIN;
    static final String LABEL = "Demo-Nutzer";
    /** A filter value no stored identity can equal: {@code .invalid} is reserved by RFC 2606. */
    static final String NO_MATCH = "no-match@example.invalid";

    private static final AuthenticationTrustResolver TRUST = new AuthenticationTrustResolverImpl();

    private final ObjectProvider<AppUserRepository> users;

    public DemoIdentityMasking(ObjectProvider<AppUserRepository> users) {
        this.users = users;
    }

    /** True when the current request is anonymous, i.e. a demo caller. */
    public static boolean anonymousCaller() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null || TRUST.isAnonymous(auth) || !auth.isAuthenticated();
    }

    /**
     * Translates a {@code createdBy} filter for the current caller.
     *
     * @param createdBy the requested filter; may be null or blank
     * @return the value to query with: unchanged for signed-in callers and exempt
     *         values, the real address for a known pseudonym, else {@link #NO_MATCH}
     */
    public String resolveFilter(String createdBy) {
        if (createdBy == null || createdBy.isBlank() || !anonymousCaller()) {
            return createdBy;
        }
        String value = createdBy.trim().toLowerCase(Locale.ROOT);
        if (!value.startsWith(PREFIX)) {
            return exempt(value) ? createdBy : NO_MATCH;
        }
        String number = value.endsWith(DOMAIN)
                ? value.substring(PREFIX.length(), value.length() - DOMAIN.length())
                : "";
        if (!number.matches("[1-9][0-9]{0,5}")) {
            return NO_MATCH;
        }
        int n = Integer.parseInt(number);
        List<String> accounts = maskedAccounts();
        return n <= accounts.size() ? accounts.get(n - 1) : NO_MATCH;
    }

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType contentType,
                                  Class<? extends HttpMessageConverter<?>> converterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {
        if (body == null || !anonymousCaller()) {
            return body;
        }
        Pseudonyms pseudonyms = new Pseudonyms();
        if (body instanceof Page<?> page) {
            return page.map(pseudonyms::apply);
        }
        if (body instanceof List<?> list) {
            return list.stream().map(pseudonyms::apply).toList();
        }
        return pseudonyms.apply(body);
    }

    static boolean exempt(String identity) {
        String value = identity.toLowerCase(Locale.ROOT);
        return value.indexOf('@') < 0 || value.endsWith(DOMAIN);
    }

    /** Lower-cased addresses of the non-exempt accounts, oldest first. */
    private List<String> maskedAccounts() {
        AppUserRepository repository = users.getIfAvailable();
        if (repository == null) {
            return List.of();
        }
        return repository.findAll().stream()
                .filter(u -> u.getEmail() != null && !exempt(u.getEmail()))
                .sorted(Comparator.comparing(AppUser::getCreatedAt,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(AppUser::getEmail))
                .map(u -> u.getEmail().toLowerCase(Locale.ROOT))
                .distinct()
                .toList();
    }

    /** One response's pseudonym table, loaded on first use. */
    private final class Pseudonyms {

        private Map<String, Integer> numbers;

        Object apply(Object dto) {
            return switch (dto) {
                case StockUpdateResultDTO r -> new StockUpdateResultDTO(r.itemName(), r.supplierName(),
                        r.change(), r.reason(), address(r.createdBy()), r.timestamp());
                case EmployeeActivityDTO e -> exemptOrNull(e.createdBy()) ? e
                        : new EmployeeActivityDTO(e.period(), address(e.createdBy()), label(e.createdBy()),
                                e.changeCount());
                case InventoryItemDTO i -> {
                    i.setCreatedBy(address(i.getCreatedBy()));
                    yield i;
                }
                case SupplierDTO s -> {
                    s.setCreatedBy(address(s.getCreatedBy()));
                    yield s;
                }
                default -> dto;
            };
        }

        private boolean exemptOrNull(String identity) {
            return identity == null || exempt(identity);
        }

        private String address(String identity) {
            if (exemptOrNull(identity)) {
                return identity;
            }
            Integer n = number(identity);
            return n == null ? FALLBACK_ADDRESS : PREFIX + n + DOMAIN;
        }

        private String label(String identity) {
            Integer n = number(identity);
            return n == null ? LABEL : LABEL + " " + n;
        }

        private Integer number(String identity) {
            if (numbers == null) {
                numbers = new HashMap<>();
                for (String account : maskedAccounts()) {
                    numbers.putIfAbsent(account, numbers.size() + 1);
                }
            }
            return numbers.get(identity.toLowerCase(Locale.ROOT));
        }
    }
}
