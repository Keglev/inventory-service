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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.smartsupplypro.inventory.controller.HealthCheckController;

/**
 * Unit tests for {@link HealthCheckController#checkDatabaseConnection()} covering UP/DOWN
 * response contracts, exception paths, and try-with-resources cleanup branches using mocked JDBC.
 */
@ExtendWith(MockitoExtension.class)
class HealthCheckControllerDbEndpointTest {

    private static final String IP_SQL = "SELECT SYS_CONTEXT('USERENV', 'IP_ADDRESS') AS ip FROM DUAL";

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
    void checkDatabaseConnection_whenRow_returnsUp() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn("1.2.3.4");

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        String body = requireBody(response);
        assertTrue(body.contains("\"status\": \"UP\""));
        assertTrue(body.contains("\"oracleSeesIp\": \"1.2.3.4\""));
    }

    @Test
    void checkDatabaseConnection_whenNoRow_returnsDown() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(false);

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        String body = assertDown(response);
        assertTrue(body.contains("\"db\": \"query failed\""));
    }

    @Test
    void checkDatabaseConnection_whenDataSourceThrows_returnsDownWithError() throws Exception {
        when(dataSource.getConnection()).thenThrow(new SQLException("no route"));

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
    }

    @Test
    void checkDatabaseConnection_whenPrepareStatementThrows_returnsDownWithError() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenThrow(new SQLException("prepare failed"));

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("prepare failed"));
    }

    @Test
    void checkDatabaseConnection_whenExecuteQueryThrows_returnsDownWithError() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenThrow(new SQLException("execute failed"));

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("execute failed"));
    }

    @Test
    void checkDatabaseConnection_whenCloseThrowsAfterSuccess_returnsDown() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn("1.2.3.4");
        doThrow(new SQLException("close failed")).when(resultSet).close();

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
    }

    @Test
    void checkDatabaseConnection_whenQueryAndCloseThrow_returnsDown() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.prepareStatement(IP_SQL)).thenReturn(statement);
        when(statement.executeQuery()).thenThrow(new SQLException("execute failed"));
        doThrow(new SQLException("close failed")).when(statement).close();

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("execute failed"));
    }

    @Test
    void checkDatabaseConnection_whenNextThrows_returnsDownWithError() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenThrow(new SQLException("next failed"));

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("next failed"));
    }

    @Test
    void checkDatabaseConnection_whenNextAndCloseThrow_returnsDownWithError() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenThrow(new SQLException("next failed"));
        doThrow(new SQLException("close failed")).when(resultSet).close();

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("next failed"));
    }

    @Test
    void checkDatabaseConnection_whenCloseThrowsError_propagates() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenReturn("1.2.3.4");
        doThrow(new AssertionError("close error")).when(resultSet).close();

        AssertionError thrown = assertThrows(AssertionError.class, () -> newController().checkDatabaseConnection());
        assertEquals("close error", thrown.getMessage());
    }

    @Test
    void checkDatabaseConnection_whenGetStringThrows_returnsDownWithError() throws Exception {
        stubDbQuery();
        when(resultSet.next()).thenReturn(true);
        when(resultSet.getString("ip")).thenThrow(new SQLException("getString failed"));

        ResponseEntity<String> response = newController().checkDatabaseConnection();

        String body = assertDown(response);
        assertTrue(body.contains("\"error\":"));
        assertTrue(body.contains("getString failed"));
    }
}
