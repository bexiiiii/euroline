package autoparts.kz.modules.auth.service;

import autoparts.kz.common.exception.UserNotFoundException;
import autoparts.kz.common.security.SimplePrincipal;
import autoparts.kz.modules.auth.dto.UserResponse;
import autoparts.kz.modules.auth.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.Principal;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final AuthService authService;
    private final UserMapper userMapper;
    
    public UserResponse getCurrentUser(Principal principal) {
        Long userId = extractUserId(principal);
        var user = authService.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        return userMapper.toUserResponse(user);
    }
    
    private Long extractUserId(Principal principal) {
        if (principal instanceof SimplePrincipal simplePrincipal) {
            return simplePrincipal.id();
        }
        // Fallback - найти по email
        String username = principal.getName();
        var user = authService.findByEmail(username)
                .orElseThrow(() -> new UserNotFoundException(username, true));
        return user.getId();
    }
}
