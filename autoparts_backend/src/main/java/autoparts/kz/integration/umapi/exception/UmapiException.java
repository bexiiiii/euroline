package autoparts.kz.integration.umapi.exception;

/**
 * Base exception for UMAPI integration errors
 */
public class UmapiException extends RuntimeException {

    public UmapiException(String message) {
        super(message);
    }

    public UmapiException(String message, Throwable cause) {
        super(message, cause);
    }
}
