package autoparts.kz.common.exception;

public class InvalidQuantityException extends RuntimeException {
    public InvalidQuantityException(int quantity) {
        super("Invalid quantity: " + quantity + ". Quantity must be positive.");
    }
}
