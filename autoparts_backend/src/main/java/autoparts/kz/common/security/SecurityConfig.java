package autoparts.kz.common.security;

import autoparts.kz.modules.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtils jwtUtils;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> authService.findByEmail(email)
                .map(user -> org.springframework.security.core.userdetails.User.builder()
                        .username(user.getEmail())
                        .password(user.getPassword())
                        .roles(user.getRole().name())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден с email: " + email));
    }

    @Bean
    @SuppressWarnings("deprecation")
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter() {
        return new JwtAuthFilter(jwtUtils, userDetailsService(), authService);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {})
                .authorizeHttpRequests(auth -> auth
                        // --- публичные эндпоинты CAT (read-only) ---
                        .requestMatchers(HttpMethod.GET, "/api/v1/cat/catalogs/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/cat/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/search/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/weekly").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/by-category/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/banners/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/search").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/external/categories").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/admin/categories/tree").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/system/maintenance").permitAll()
                        // News endpoints
                        .requestMatchers(HttpMethod.GET, "/api/news/published").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/news/{id}").permitAll()
                        // New unified wizard endpoints with body-only SSD
                        .requestMatchers(HttpMethod.POST, "/api/v1/wizard/start").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/wizard/next").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/wizard/finish").permitAll()
                        // --- debug raw endpoints for wizard (dev only) ---
                        .requestMatchers(HttpMethod.POST, "/api/v1/cat/debug/**").permitAll()
                        // SSE stream for notifications (auth via token query param)
                        .requestMatchers(HttpMethod.GET, "/api/notifications/stream").permitAll()
                        // --- публичные шаги мастера подбора (используем AntPath, чтобы обойти ограничения PathPattern) ---
                        .requestMatchers(
                                new AntPathRequestMatcher("/api/v1/cat/*/wizard/next", "POST"),
                                new AntPathRequestMatcher("/api/v1/cat/*/wizard/finish", "POST")
                        ).permitAll()
                        // --- CORS preflight ---
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/search").permitAll()
                        .requestMatchers("/api/auth/signup", "/api/auth/login").permitAll()
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                        // Static files access
                        .requestMatchers("/files/**", "/uploads/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/api/profile/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/api/customers/my/search-history").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/api/finance/my/top-ups").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/api/finance/my/top-ups/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/api/finance/my/balance").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/api/finance/my/transactions").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/api/admin/categories").hasRole("ADMIN")
                        // News admin endpoints - require ADMIN role
                        .requestMatchers(HttpMethod.GET, "/api/news").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/news").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/news/{id}").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/news/{id}").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                        
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
