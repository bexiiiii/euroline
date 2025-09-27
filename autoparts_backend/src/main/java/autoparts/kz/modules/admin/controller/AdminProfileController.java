package autoparts.kz.modules.admin.controller;

import autoparts.kz.modules.admin.dto.AdminProfileResponse;
import autoparts.kz.modules.auth.entity.User;
import autoparts.kz.modules.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProfileController {

    private final AuthService authService;

    @GetMapping("/profile")
    public ResponseEntity<?> getAdminProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Get the username from the authenticated principal
        String username = authentication.getName();
        
        // Find the user in the database
        Optional<User> userOpt = authService.findByEmail(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            // Check if the user has ADMIN role
            if (user.getRole().name().equals("ADMIN")) {
                AdminProfileResponse profile = new AdminProfileResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getName() != null ? user.getName() : "Администратор",
                    user.isBanned()
                );
                
                return ResponseEntity.ok(profile);
            }
        }
        
        // If user not found or not an admin
        return ResponseEntity.status(403).body("Access denied");
    }
}
