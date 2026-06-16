package com.smartsupplypro.inventory.exception.dto;

/**
 * Error response payload returned for all handled exceptions.
 *
 * @param error     normalized HTTP status token (e.g., {@code "bad_request"})
 * @param message   human-readable error description
 * @param timestamp ISO-8601 time the error occurred
 */
public record ErrorResponse(String error, String message, String timestamp) {}
