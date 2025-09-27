package autoparts.kz.modules.auth.controller;

import autoparts.kz.common.security.JwtUtils;
import autoparts.kz.modules.auth.dto.AuthResponse;
import autoparts.kz.modules.auth.dto.LoginRequest;
import autoparts.kz.modules.auth.dto.PasswordChangeRequest;
import autoparts.kz.modules.auth.dto.RegisterRequest;
import autoparts.kz.modules.auth.dto.UserResponse;
import autoparts.kz.modules.auth.service.AuthService;
import autoparts.kz.modules.auth.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import autoparts.kz.common.security.SimplePrincipal;

import java.security.Principal;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final AuthService authService;
    private final UserService userService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest authRequest,
                                              HttpServletRequest request) {
        if (authService.isBanned(authRequest.getEmail())) {
            throw new BadCredentialsException("User is banned");
        }
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword())
        );

        UserDetails user = (UserDetails) authentication.getPrincipal();
        String jwt = jwtUtils.generateToken(user);
        authService.updateLastBrowser(authRequest.getEmail(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(new AuthResponse(jwt));
    }
    
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@Valid @RequestBody RegisterRequest request) {
        if (authService.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body("Такой email уже зарегистрирован");
        }
        authService.registerUser(request);
        return ResponseEntity.ok("Пользователь успешно зарегистрирован");
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Principal principal) {
        UserResponse userResponse = userService.getCurrentUser(principal);
        return ResponseEntity.ok(userResponse);
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(@AuthenticationPrincipal SimplePrincipal principal,
                                                @Valid @RequestBody PasswordChangeRequest request) {
        try {
            authService.changePassword(principal.id(), request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok("Пароль успешно изменен");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
