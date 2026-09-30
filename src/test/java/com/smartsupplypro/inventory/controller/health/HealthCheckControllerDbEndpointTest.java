package com.smartsupplypro.inventory.controller.health;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import com.smartsupplypro.inventory.controller.HealthCheckController;

/**
 * Unit tests for {@link HealthCheckController#checkDatabaseConnection(Authentication)} covering
 * who sees which UP fields, the fixed DOWN body on every failure path, the log line that keeps
 * the failure detail, and try-with-resources cleanup branches using mocked JDBC.
 */
@ExtendWith({ MockitoExtension.class, OutputCaptureExtension.class })
class HealthCheckControllerDbEndpointTest {

    private static final String IP_SQL = "SELECT SYS_CONTEXT('USERENV', 'IP_ADDRESS') AS ip FROM DUAL";
    private static final Authentication ADMIN = new TestingAuthenticationToken("admin", null, "ROLE_ADMIN");
    private static final Authentication USER = new TestingAuthenticationToken("user", null, "ROLE_USER");
    private static final Map<String, String> UP = Map.of("status", "UP");
    private static final Map<String, String> DOWN = Map.of("status", "DOWN");

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private PreparedStatement statement;

    @Mock
    private ResultSet resultSet;

    private HealthCheckController newController() {
        return new HealthCheckController(dataSource);
    }

    private void stubDbQuery() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenReturn(resultSet);
    }

    private static void assertDown(ResponseEntity<Map<String, String>> response) {
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertEquals(DOWN, response.getBody());
    }

    @Test
    void should_return_up_with_the_ip_when_an_admin_asks_and_the_database_returns_a_row() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn("1.2.3.4");

        ResponseEntity<Map<String, String>> response = newController().checkDatabaseConnection(ADMIN);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(Map.of("status", "UP", "oracleSeesIp", "1.2.3.4"), response.getBody());
    }

    @Test
    void should_return_up_without_the_ip_when_an_anonymous_caller_asks() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);

        ResponseEntity<Map<String, String>> response = newController().checkDatabaseConnection(null);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(UP, response.getBody());
    }

    @Test
    void should_return_up_without_the_ip_when_a_user_without_the_admin_role_asks() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);

        ResponseEntity<Map<String, String>> response = newController().checkDatabaseConnection(USER);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(UP, response.getBody());
    }

    @Test
    void should_report_the_ip_as_null_text_when_the_database_returns_no_address() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn(null);

        ResponseEntity<Map<String, String>> response = newController().checkDatabaseConnection(ADMIN);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(Map.of("status", "UP", "oracleSeesIp", "null"), response.getBody());
    }

    @Test
    void should_return_down_when_the_database_returns_no_row() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(false);

        assertDown(newController().checkDatabaseConnection(ADMIN));
    }

    @Test
    void should_keep_the_failure_detail_in_the_log_and_out_of_the_body_when_the_data_source_throws(
            CapturedOutput output) throws Exception {
        when(dataSource.getConnection()).thenThrow(new SQLException("ORA-12506: listener rejected 10.0.0.9"));

        assertDown(newController().checkDatabaseConnection(ADMIN));
        assertTrue(output.getOut().contains("ORA-12506: listener rejected 10.0.0.9"));
    }

    @Test
    void should_return_down_when_prepare_statement_throws() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenThrow(new SQLException("prepare failed"));

        assertDown(newController().checkDatabaseConnection(ADMIN));
    }

    @Test
    void should_return_down_when_execute_query_throws() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenThrow(new SQLException("execute failed"));

        assertDown(newController().checkDatabaseConnection(ADMIN));
    }

    @Test
    void should_return_down_when_close_throws_after_a_successful_query() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn("1.2.3.4");
        doThrow(new SQLException("close failed")).when(resultSet).close();

        assertDown(newController().checkDatabaseConnection(ADMIN));
    }

    @Test
    void should_return_down_when_both_the_query_and_close_throw() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenThrow(new SQLException("execute failed"));
        doThrow(new SQLException("close failed")).when(statement).close();

        assertDown(newController().checkDatabaseConnection(ADMIN));
    }

    @Test
    void should_return_down_when_next_throws() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenThrow(new SQLException("next failed"));

        assertDown(newController().checkDatabaseConnection(ADMIN));
    }

    @Test
    void should_return_down_when_next_and_close_both_throw() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenThrow(new SQLException("next failed"));
        doThrow(new SQLException("close failed")).when(resultSet).close();

        assertDown(newController().checkDatabaseConnection(ADMIN));
    }

    @Test
    void should_propagate_when_close_throws_an_error() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn("1.2.3.4");
        doThrow(new AssertionError("close error")).when(resultSet).close();

        AssertionError thrown = assertThrows(AssertionError.class,
                () -> newController().checkDatabaseConnection(ADMIN));
        assertEquals("close error", thrown.getMessage());
    }

    @Test
    void should_return_down_when_get_string_throws() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenThrow(new SQLException("getString failed"));

        assertDown(newController().checkDatabaseConnection(ADMIN));
    }
}
