package com.smartsupplypro.inventory.security;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.json.JsonCompareMode;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.OAuth2Config;
import com.smartsupplypro.inventory.config.SecurityAuthorizationHelper;
import com.smartsupplypro.inventory.config.SecurityConfig;
import com.smartsupplypro.inventory.config.SecurityEntryPointHelper;
import com.smartsupplypro.inventory.config.SecurityFilterHelper;
import com.smartsupplypro.inventory.controller.HealthCheckController;

/**
 * Proves through the production {@link SecurityConfig} that GET /api/health/db stays open to
 * anonymous callers, shows the database-side address only to an ADMIN, and answers failures
 * with a fixed JSON body.
 */
@WebMvcTest(controllers = HealthCheckController.class)
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "app.demo-readonly=false",
    "app.frontend.base-url=https://frontend.test",
    "spring.main.banner-mode=off",
    "logging.level.root=WARN"
})
@Import({
    SecurityConfig.class,
    SecurityAuthorizationHelper.class,
    SecurityFilterHelper.class,
    SecurityEntryPointHelper.class,
    OAuth2Config.class,
    SecurityTestBeans.class
})
class HealthCheckDbAccessTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private DataSource dataSource;

    private void stubAddress(String ip) throws SQLException {
        Connection connection = mock(Connection.class);
        PreparedStatement statement = mock(PreparedStatement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(anyString())).thenReturn(statement);
        when(statement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn(ip);
    }

    @Test
    void should_answer_status_only_when_an_anonymous_caller_asks() throws Exception {
        stubAddress("203.0.113.7");

        mvc.perform(get("/api/health/db"))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(content().json("{\"status\":\"UP\"}", JsonCompareMode.STRICT));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void should_include_the_database_side_address_when_an_admin_asks() throws Exception {
        stubAddress("203.0.113.7");

        mvc.perform(get("/api/health/db"))
            .andExpect(status().isOk())
            .andExpect(content().json(
                "{\"status\":\"UP\",\"oracleSeesIp\":\"203.0.113.7\"}", JsonCompareMode.STRICT));
    }

    @Test
    void should_answer_a_fixed_down_body_when_the_database_fails() throws Exception {
        when(dataSource.getConnection()).thenThrow(new SQLException("ORA-12506: listener rejected"));

        mvc.perform(get("/api/health/db"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(content().json("{\"status\":\"DOWN\"}", JsonCompareMode.STRICT));
    }
}
