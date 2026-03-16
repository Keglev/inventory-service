package com.smartsupplypro.inventory.controller.health;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Map;

import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import com.smartsupplypro.inventory.controller.HealthCheckController;

/**
 * # HealthCheckControllerHealthEndpointTest
 *
 * Unit tests for {@link HealthCheckController#health()}.
 *
 * <p><strong>Purpose</strong></p>
 * Validate the high-level service health endpoint used by operational tooling and uptime checks.
 * The endpoint combines a basic "service is running" signal with a lightweight database ping.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>HTTP 200 when the DB ping succeeds</li>
 *   <li>HTTP 503 when the DB ping fails (connection/prepare/execute failures)</li>
 *   <li>Response body contract: {@code status}, {@code database}, {@code timestamp}</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Pure unit tests with mocked JDBC primitives keep results deterministic and avoid
 *       environment coupling (e.g., paused Oracle instances).</li>
 *   <li>Assertions avoid brittle exact timestamp equality; we validate type and positivity.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class HealthCheckControllerHealthEndpointTest {

    private static final String PING_SQL = "SELECT 1 FROM DUAL";

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

    private static Map<String, Object> requireBody(ResponseEntity<Map<String, Object>> response) {
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        return body;
    }

    @Test
    @DisplayName("GET /api/health returns 200 when DB ping succeeds")
    void health_whenDbUp_returns200() throws Exception {
        // GIVEN: DataSource can connect and "SELECT 1" returns a row
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(PING_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(true);

        // WHEN
        ResponseEntity<Map<String, Object>> response = newController().health();

        // THEN
        assertEquals(HttpStatus.OK, response.getStatusCode());

        Map<String, Object> body = requireBody(response);
        assertEquals("ok", body.get("status"));
        assertEquals("ok", body.get("database"));

        Object timestamp = body.get("timestamp");
        assertNotNull(timestamp);
        assertTrue(timestamp instanceof Number);
        assertTrue(((Number) timestamp).longValue() > 0L);
    }

    @Test
    @DisplayName("GET /api/health returns 503 when DB connection fails")
    void health_whenDbDown_returns503() throws Exception {
        // GIVEN
        when(dataSource.getConnection()).thenThrow(new SQLException("db down"));

        // WHEN
        ResponseEntity<Map<String, Object>> response = newController().health();

        // THEN
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());

        Map<String, Object> body = requireBody(response);
        assertEquals("ok", body.get("status"));
        assertEquals("down", body.get("database"));
    }

    @Test
    @DisplayName("GET /api/health returns 503 when statement preparation fails")
    void health_whenPrepareStatementThrows_returns503() throws Exception {
        // GIVEN
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(PING_SQL)).thenThrow(new SQLException("prepare failed"));

        // WHEN
        ResponseEntity<Map<String, Object>> response = newController().health();

        // THEN
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());

        Map<String, Object> body = requireBody(response);
        assertEquals("ok", body.get("status"));
        assertEquals("down", body.get("database"));
    }

    @Test
    @DisplayName("GET /api/health returns 503 when query execution fails")
    void health_whenExecuteQueryThrows_returns503() throws Exception {
        // GIVEN
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(PING_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenThrow(new SQLException("execute failed"));

        // WHEN
        ResponseEntity<Map<String, Object>> response = newController().health();

        // THEN
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());

        Map<String, Object> body = requireBody(response);
        assertEquals("ok", body.get("status"));
        assertEquals("down", body.get("database"));
    }
}
