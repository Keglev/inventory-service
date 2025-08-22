
package com.smartsupplypro.inventory.exception;

/**
 * Exception thrown when a request is invalid, typically due to missing or incorrect parameters.
 * This exception is used to indicate that the request cannot be processed due to client-side errors.
 */
public class InvalidRequestException extends RuntimeException {
  public InvalidRequestException(String message) { super(message); }
}

