package autoparts.kz.common.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@Slf4j
public class JwtUtils {

    @Value("${security.jwt.secret:change-me-please-this-is-a-very-long-secret-key-for-jwt-signing-that-meets-security-requirements}")
    private String jwtSecret;

    @Value("${security.jwt.expiration-ms:86400000}")
    private int jwtExpirationMs;

    private SecretKey getSigningKey() {
        // Ensure the key is long enough for HS256 algorithm
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            log.warn("JWT secret is too short, generating a secure key");
            return Keys.secretKeyFor(SignatureAlgorithm.HS256);
        }
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(UserDetails userDetails) {
        log.info("Генерируем JWT токен для пользователя: {}", userDetails.getUsername());
        
        String token = Jwts.builder()
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
                
        log.info("JWT токен сгенерирован успешно, длина: {}", token.length());
        return token;
    }

    public String extractUsername(String token) {
        try {
            log.debug("Извлекаем username из токена, используемый секрет (первые 10 символов): {}", 
                jwtSecret.substring(0, Math.min(10, jwtSecret.length())));
            
            String username = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
                    
            log.info("Username успешно извлечен: {}", username);
            return username;
        } catch (Exception e) {
            log.error("Ошибка при извлечении username из токена: {}", e.getMessage());
            throw e;
        }
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            boolean valid = (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
            log.info("Проверка токена для пользователя {}: {}", userDetails.getUsername(), valid);
            return valid;
        } catch (Exception e) {
            log.error("Ошибка при проверке валидности токена: {}", e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
        return expiration.before(new Date());
    }
}

