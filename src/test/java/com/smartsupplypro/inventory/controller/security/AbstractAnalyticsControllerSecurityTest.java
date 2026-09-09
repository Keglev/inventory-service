package com.smartsupplypro.inventory.controller.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.smartsupplypro.inventory.controller.AnalyticsController;
import com.smartsupplypro.inventory.controller.StockAnalyticsController;
import com.smartsupplypro.inventory.controller.StockReasonAnalyticsController;
import com.smartsupplypro.inventory.controller.StockUpdateAnalyticsController;

/**
 * Shared MockMvc and Spring Security context for analytics controller security tests.
 */
@WebMvcTest(
        controllers = {
            AnalyticsController.class,
            StockAnalyticsController.class,
            StockUpdateAnalyticsController.class,
            StockReasonAnalyticsController.class
        }
)
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@Import(AnalyticsSecurityTestSupport.class)
public abstract class AbstractAnalyticsControllerSecurityTest {

    protected static final String USER = "USER";

    @Autowired
    protected MockMvc mockMvc;

}
