package autoparts.kz.modules.cml.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class IpAllowlistFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(IpAllowlistFilter.class);

    private final Set<String> allowedHosts = new HashSet<>();

    public IpAllowlistFilter(List<String> allowedIps) {
        allowedHosts.addAll(allowedIps);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String remoteAddr = request.getRemoteAddr();
        if (!isAllowed(remoteAddr)) {
            log.warn("Blocking request from IP {} for {}", remoteAddr, request.getRequestURI());
            response.sendError(HttpStatus.FORBIDDEN.value(), "Forbidden");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isAllowed(String ip) {
        if (!StringUtils.hasText(ip)) {
            return false;
        }
        if (allowedHosts.contains(ip)) {
            return true;
        }
        try {
            InetAddress address = InetAddress.getByName(ip);
            return allowedHosts.contains(address.getHostAddress());
        } catch (UnknownHostException e) {
            return false;
        }
    }
}
