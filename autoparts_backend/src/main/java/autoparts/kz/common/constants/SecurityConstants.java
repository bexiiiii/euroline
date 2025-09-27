package autoparts.kz.common.constants;

public final class SecurityConstants {
    public static final int JWT_PARTS_COUNT = 3;
    public static final int BEARER_PREFIX_LENGTH = 7;
    public static final String BEARER_PREFIX = "Bearer ";
    public static final String AUTHORIZATION_HEADER = "Authorization";
    public static final int PASSWORD_MIN_LENGTH = 8;
    
    private SecurityConstants() {
        // Utility class
    }
}
