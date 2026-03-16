package com.smartsupplypro.inventory.controller.health;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import com.smartsupplypro.inventory.controller.HealthCheckController;

/**
 * # HealthCheckControllerDbEndpointTest
 *
 * Unit tests for {@link HealthCheckController#checkDatabaseConnection()}.
 *
 * <p><strong>Purpose</strong></p>
 * Validate the database diagnostic endpoint used during incident response and connectivity
 * triage. This endpoint runs an Oracle-specific query and reports whether the application can
 * execute a request/response round-trip against the DB.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>HTTP 200 + "UP" when the Oracle query returns a row</li>
 *   <li>HTTP 503 + "DOWN" for no-row results and for exception scenarios</li>
 *   <li>Exception-path robustness, including failures during try-with-resources cleanup</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>These are unit tests using mocked JDBC primitives to avoid external DB dependency.</li>
 *   <li>Assertions validate stable response fragments rather than exact JSON formatting.</li>
 *   <li>An {@code Error} thrown during cleanup is expected to propagate because the controller
 *       catches {@code Exception}, not {@code Throwable}; the test documents that contract.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class HealthCheckControllerDbEndpointTest {

    private static final String IP_SQL = "SELECT SYS_CONTEXT('USERENV', 'IP_ADDRESS') As ip FROM DUAL";

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @Mock
    private PreparedStatement statement;

    @Mock
    private ResultSet resultSet;

    private HealthCheckController newController() {
        HealthCheckController controller = new HealthCheckController();
        ReflectionTestUtils.setField(controller, "dataSource", dataSource);
        return controller;
    }

    private void stubDbQuery() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenReturn(resultSet);
    }

    private static String requireBody(ResponseEntity<String> response) {
        String body = response.getBody();
        assertNotNull(body);
        return body;
    }

    private static String assertDown(ResponseEntity<String> response) {
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        String body = requireBody(response);
        assertTrue(body.contains("\"status\": \"DOWN\""));
        return body;
    }

    @Test
    @DisplayName("GET /api/health/db returns UP when Oracle query returns a row")
    void checkDatabaseConnection_whenRow_returnsUp() throws Exception {
        // GIVEN
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn("1.2.3.4");

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        assertEquals(HttpStatus.OK, response.getStatusCode());
        String body = requireBody(response);
        assertTrue(body.contains("\"status\": \"UP\""));
        assertTrue(body.contains("\"oracleSeesIp\": \"1.2.3.4\""));
    }

    @Test
    @DisplayName("GET /api/health/db returns 503 when query returns no rows")
    void checkDatabaseConnection_whenNoRow_returnsDown() throws Exception {
        // GIVEN
        stubDbQuery();
        when(resultSet.next()).thenReturn(false);

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        String body = assertDown(response);
        assertTrue(body.contains("\"db\": \"query failed\""));
    }

    @Test
    @DisplayName("GET /api/health/db returns 503 with error when datasource throws")
    void checkDatabaseConnection_whenDataSourceThrows_returnsDownWithError() throws Exception {
        // GIVEN
        when(dataSource.getConnection()).thenThrow(new SQLException("no route"));

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
    }

    @Test
    @DisplayName("GET /api/health/db returns 503 when statement preparation throws")
    void checkDatabaseConnection_whenPrepareStatementThrows_returnsDownWithError() throws Exception {
        // GIVEN
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenThrow(new SQLException("prepare failed"));

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("prepare failed"));
    }

    @Test
    @DisplayName("GET /api/health/db returns 503 when query execution throws")
    void checkDatabaseConnection_whenExecuteQueryThrows_returnsDownWithError() throws Exception {
        // GIVEN
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenThrow(new SQLException("execute failed"));

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("execute failed"));
    }

    @Test
    @DisplayName("GET /api/health/db returns 503 when ResultSet close() throws after a successful query")
    void checkDatabaseConnection_whenCloseThrowsAfterSuccess_returnsDown() throws Exception {
        // GIVEN
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn("1.2.3.4");
        doThrow(new SQLException("close failed")).when(resultSet).close();

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
    }

    @Test
    @DisplayName("GET /api/health/db returns 503 when query throws and close() also throws (suppressed exception path)")
    void checkDatabaseConnection_whenQueryAndCloseThrow_returnsDown() throws Exception {
        // GIVEN
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenThrow(new SQLException("execute failed"));
        doThrow(new SQLException("close failed")).when(statement).close();

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("execute failed"));
    }

    @Test
    @DisplayName("GET /api/health/db returns 503 when ResultSet.next() throws")
    void checkDatabaseConnection_whenNextThrows_returnsDownWithError() throws Exception {
        // GIVEN
        stubDbQuery();
        when(resultSet.next()).thenThrow(new SQLException("next failed"));

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("next failed"));
    }

    @Test
    @DisplayName("GET /api/health/db returns 503 when next() throws and close() also throws (suppressed cleanup branch)")
    void checkDatabaseConnection_whenNextAndCloseThrow_returnsDownWithError() throws Exception {
        // GIVEN
        stubDbQuery();
        when(resultSet.next()).thenThrow(new SQLException("next failed"));
        doThrow(new SQLException("close failed")).when(resultSet).close();

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("next failed"));
    }

    @Test
    @DisplayName("GET /api/health/db propagates Errors thrown during resource cleanup")
    void checkDatabaseConnection_whenCloseThrowsError_propagates() throws Exception {
        // GIVEN
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn("1.2.3.4");
        doThrow(new AssertionError("close error")).when(resultSet).close();

        // WHEN/THEN
        AssertionError thrown = assertThrows(AssertionError.class, () -> newController().checkDatabaseConnection());
        assertEquals("close error", thrown.getMessage());
    }

    @Test
    @DisplayName("GET /api/health/db returns 503 when ResultSet.getString() throws")
    void checkDatabaseConnection_whenGetStringThrows_returnsDownWithError() throws Exception {
        // GIVEN
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenThrow(new SQLException("getString failed"));

        // WHEN
        ResponseEntity<String> response = newController().checkDatabaseConnection();

        // THEN
        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("getString failed"));
    }
}
