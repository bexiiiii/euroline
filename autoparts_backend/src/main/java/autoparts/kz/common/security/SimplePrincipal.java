package autoparts.kz.common.security;

import java.security.Principal;

public record SimplePrincipal(Long id, String username) implements Principal {
    @Override
    public String getName() {
        return username;
    }
}
