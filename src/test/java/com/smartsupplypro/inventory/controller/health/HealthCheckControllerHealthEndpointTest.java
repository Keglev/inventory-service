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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.smartsupplypro.inventory.controller.HealthCheckController;

/**
 * Unit tests for {@link HealthCheckController#health()} covering DB-up (200), DB-down (503),
 * and response body contract using mocked JDBC primitives.
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
        return new HealthCheckController(dataSource);
    }

    private static Map<String, Object> requireBody(ResponseEntity<Map<String, Object>> response) {
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        return body;
    }

    @Test
    void health_whenDbUp_returns200() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(PING_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenReturn(resultSet);
        when(resultSet.next()).thenReturn(true);

        ResponseEntity<Map<String, Object>> response = newController().health();

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
    void health_whenDbDown_returns503() throws Exception {
        when(dataSource.getConnection()).thenThrow(new SQLException("db down"));

        ResponseEntity<Map<String, Object>> response = newController().health();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());

        Map<String, Object> body = requireBody(response);
        assertEquals("ok", body.get("status"));
        assertEquals("down", body.get("database"));
    }

    @Test
    void health_whenPrepareStatementThrows_returns503() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(PING_SQL)).thenThrow(new SQLException("prepare failed"));

        ResponseEntity<Map<String, Object>> response = newController().health();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());

        Map<String, Object> body = requireBody(response);
        assertEquals("ok", body.get("status"));
        assertEquals("down", body.get("database"));
    }

    @Test
    void health_whenExecuteQueryThrows_returns503() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(PING_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenThrow(new SQLException("execute failed"));

        ResponseEntity<Map<String, Object>> response = newController().health();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());

        Map<String, Object> body = requireBody(response);
        assertEquals("ok", body.get("status"));
        assertEquals("down", body.get("database"));
    }
}
