package autoparts.kz.modules.cml.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
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
    private final boolean sslEnabled;

    @Autowired
    public CmlSecurityConfig(CommerceMlProperties properties,
                             RequestIdFilter requestIdFilter,
                             @Value("${server.ssl.enabled:true}") boolean sslEnabled) {
        this.properties = properties;
        this.requestIdFilter = requestIdFilter;
        this.sslEnabled = sslEnabled;
    }

    @Bean
    @Order(0)
    public SecurityFilterChain cmlSecurityFilterChain(HttpSecurity http) throws Exception {
        http.securityMatcher("/api/1c-exchange/**")
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(requestIdFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new IpAllowlistFilter(properties.getAllowedIps()), UsernamePasswordAuthenticationFilter.class);
        if (sslEnabled) {
            http.requiresChannel(channel -> channel.anyRequest().requiresSecure());
        }
        return http.build();
    }

    @Bean
    public UserDetailsService cmlUserDetailsService(PasswordEncoder passwordEncoder) {
        return new InMemoryUserDetailsManager(
                User.withUsername(properties.getUsername())
                        .password(passwordEncoder.encode(properties.getPassword()))
                        .roles("CML")
                        .build()
        );
    }
}
