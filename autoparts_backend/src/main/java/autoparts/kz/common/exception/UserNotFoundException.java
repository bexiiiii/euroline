package autoparts.kz.common.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
    
    public UserNotFoundException(Long userId) {
        super("User not found with id: " + userId);
    }
    
    public UserNotFoundException(String email, boolean byEmail) {
        super("User not found with email: " + email);
    }
}
