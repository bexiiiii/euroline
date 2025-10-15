package autoparts.kz.integration.umapi.exception;

/**
 * Exception thrown when connection to UMAPI fails
 */
public class UmapiConnectionException extends UmapiException {

    public UmapiConnectionException(String message) {
        super(message);
    }

    public UmapiConnectionException(String message, Throwable cause) {
        super(message, cause);
    }
}
