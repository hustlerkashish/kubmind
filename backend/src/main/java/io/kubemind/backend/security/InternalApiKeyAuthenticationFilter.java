package io.kubemind.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;

@Component
public class InternalApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-Internal-API-Key";

    private final String configuredApiKey;

    public InternalApiKeyAuthenticationFilter(
            @Value("${INTERNAL_API_KEY:}") String configuredApiKey) {
        this.configuredApiKey = configuredApiKey;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI()
                .substring(request.getContextPath().length());

        boolean kubernetesReadRequest =
                "GET".equalsIgnoreCase(request.getMethod())
                && (path.equals("/k8s") || path.startsWith("/k8s/"));

        if (kubernetesReadRequest
                && configuredApiKey != null
                && !configuredApiKey.isBlank()) {

            String suppliedKey = request.getHeader(HEADER);

            if (suppliedKey != null && !suppliedKey.isBlank()) {
                boolean valid = MessageDigest.isEqual(
                        configuredApiKey.getBytes(StandardCharsets.UTF_8),
                        suppliedKey.getBytes(StandardCharsets.UTF_8)
                );

                if (valid) {
                    var authentication =
                            new UsernamePasswordAuthenticationToken(
                                    "kubemind-internal-service",
                                    null,
                                    List.of(new SimpleGrantedAuthority(
                                            "ROLE_INTERNAL_SERVICE"
                                    ))
                            );

                    SecurityContextHolder.getContext()
                            .setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
