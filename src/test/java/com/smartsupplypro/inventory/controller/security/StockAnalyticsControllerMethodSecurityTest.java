package com.smartsupplypro.inventory.controller.security;

import java.util.stream.Stream;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.controller.StockAnalyticsController;

/**
 * Method security of {@link StockAnalyticsController} on its own: the filter chain is off,
 * so the role rule alone decides. Every endpoint denies an anonymous caller unless demo
 * mode is on. The caller is an anonymous authentication, as the anonymous filter would
 * set it; with no authentication at all, Spring denies before reading the rule.
 */
@WebMvcTest(controllers = StockAnalyticsController.class)
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@WithAnonymousUser
@Import({AnalyticsSecurityTestSupport.class, StockAnalyticsControllerMethodSecurityTest.DemoFlag.class})
class StockAnalyticsControllerMethodSecurityTest {

    @Autowired MockMvc mockMvc;
    @Autowired AppProperties appProperties;

    static Stream<String> endpoints() {
        return Stream.of(
            "/api/analytics/stock-value?start=2024-02-01&end=2024-02-28",
            "/api/analytics/stock-per-supplier",
            "/api/analytics/low-stock/count",
            "/api/analytics/item-update-frequency?supplierId=S1",
            "/api/analytics/low-stock-items?supplierId=S1",
            "/api/analytics/monthly-stock-movement?start=2024-02-01&end=2024-02-28",
            "/api/analytics/price-trend?itemId=I1&start=2024-02-01&end=2024-02-28");
    }

    @AfterEach
    void resetDemoMode() {
        appProperties.setDemoReadonly(false);
    }

    @ParameterizedTest
    @MethodSource("endpoints")
    void should_deny_an_anonymous_caller_when_demo_mode_is_off(String url) throws Exception {
        // 403 from the exception handler; in the app the URL layer answers 401 before this
        mockMvc.perform(get(url)).andExpect(status().isForbidden());
    }

    @ParameterizedTest
    @MethodSource("endpoints")
    void should_admit_an_anonymous_caller_when_demo_mode_is_on(String url) throws Exception {
        appProperties.setDemoReadonly(true);
        mockMvc.perform(get(url)).andExpect(status().isOk());
    }

    /** The bean the role rule reads as {@code @appProperties.demoReadonly}. */
    @TestConfiguration
    static class DemoFlag {
        @Bean
        AppProperties appProperties() {
            return new AppProperties();
        }
    }
}
