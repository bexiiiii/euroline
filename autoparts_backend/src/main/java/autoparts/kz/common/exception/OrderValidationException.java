package autoparts.kz.common.exception;

/** A client-correctable order error, such as an item without an actual price. */
public class OrderValidationException extends RuntimeException {
    public OrderValidationException(String message) {
        super(message);
    }
}
