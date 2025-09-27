package autoparts.kz.common.exception;

public class DuplicateRequestException extends RuntimeException {
    public DuplicateRequestException(String idempotencyKey) {
        super("Duplicate request with idempotency key: " + idempotencyKey);
    }
}
