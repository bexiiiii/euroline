package autoparts.kz.modules.cml.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class CmlSecurityConfig {

    private final CommerceMlProperties properties;
    private final RequestIdFilter requestIdFilter;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public CmlSecurityConfig(CommerceMlProperties properties,
                             RequestIdFilter requestIdFilter,
                             PasswordEncoder passwordEncoder) {
        this.properties = properties;
        this.requestIdFilter = requestIdFilter;
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    @Order(1)
    public SecurityFilterChain cmlSecurityFilterChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/api/1c-exchange", "/api/1c-exchange/**")
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(cmlAuthenticationProvider())
                .addFilterBefore(requestIdFilter, UsernamePasswordAuthenticationFilter.class);
                // Убираем IP фильтр для продакшена, так как запросы идут через nginx
                // .addFilterBefore(new IpAllowlistFilter(properties.getAllowedIps()), UsernamePasswordAuthenticationFilter.class);
        
        // Не форсируем HTTPS на уровне приложения - это делает nginx
        // if (sslEnabled) {
        //     http.requiresChannel(channel -> channel.anyRequest().requiresSecure());
        // }
        return http.build();
    }

    @Bean
    public UserDetailsService cmlUserDetailsService() {
        return new InMemoryUserDetailsManager(
                User.withUsername(properties.getUsername())
                        .password(passwordEncoder.encode(properties.getPassword()))
                        .roles("CML")
                        .build()
        );
    }
    
    @Bean
    @SuppressWarnings("deprecation")
    public AuthenticationProvider cmlAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(cmlUserDetailsService());
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }
}
