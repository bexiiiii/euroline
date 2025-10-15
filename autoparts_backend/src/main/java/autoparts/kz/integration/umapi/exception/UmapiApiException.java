package autoparts.kz.integration.umapi.exception;

/**
 * Exception thrown when UMAPI returns an error response
 */
public class UmapiApiException extends UmapiException {

    private final int statusCode;

    public UmapiApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public UmapiApiException(String message, int statusCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
