package io.kubemind.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;

@Component
public class JwtTokenProvider {

    private static final Set<String> KNOWN_COMPROMISED_SECRETS = Set.of(
            "404e635266556a586e3272357538782f413f4428472b4b6250645367566b5970",
            "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b"
    );

    private final Environment environment;

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationInMs = 86400000L;

    public JwtTokenProvider() {
        this.environment = null;
    }

    @Autowired
    public JwtTokenProvider(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    public void validateJwtConfiguration() {
        // 1. Missing secret validation
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException(
                "Mandatory JWT signing secret (JWT_SECRET / app.jwt.secret) is missing. Set a cryptographically secure 256-bit secret via environment variables."
            );
        }

        // 2. Minimum 256-bit (32 bytes) key length validation
        byte[] secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException(
                "Insecure JWT secret: Key length is " + (secretBytes.length * 8) + " bits. JJWT requires at least 256 bits (32 bytes) for HMAC-SHA algorithms."
            );
        }

        // 3. Production profile checks
        if (isProductionEnvironment()) {
            // Reject known compromised repository fallback keys in production
            String normalizedSecret = jwtSecret.trim().toLowerCase();
            if (KNOWN_COMPROMISED_SECRETS.contains(normalizedSecret)) {
                throw new IllegalStateException(
                    "Production startup rejected: Known compromised repository default secret detected in JWT_SECRET. Rotate JWT_SECRET with a newly generated random 256-bit secret."
                );
            }

            // In production, JWT_EXPIRATION_MS must be explicitly configured, non-empty, and positive
            String expirationProp = environment != null ? environment.getProperty("JWT_EXPIRATION_MS") : null;
            if (expirationProp == null || expirationProp.trim().isEmpty()) {
                throw new IllegalStateException(
                    "Production startup rejected: JWT_EXPIRATION_MS must be explicitly configured in production environment."
                );
            }

            try {
                long parsedExpiration = Long.parseLong(expirationProp.trim());
                if (parsedExpiration <= 0) {
                    throw new IllegalStateException(
                        "Production startup rejected: JWT_EXPIRATION_MS must be greater than zero, but got: " + parsedExpiration
                    );
                }
                this.jwtExpirationInMs = parsedExpiration;
            } catch (NumberFormatException e) {
                throw new IllegalStateException(
                    "Production startup rejected: JWT_EXPIRATION_MS must be a valid positive number, but got: " + expirationProp
                );
            }
        } else {
            // Development validation: expiration must be positive (defaults to 24 hours / 86400000ms)
            if (this.jwtExpirationInMs <= 0) {
                throw new IllegalStateException(
                    "Invalid JWT expiration configuration: Expiration must be greater than zero, but got: " + this.jwtExpirationInMs
                );
            }
        }
    }

    public boolean isProductionEnvironment() {
        if (environment == null) {
            return false;
        }
        for (String profile : environment.getActiveProfiles()) {
            if (profile != null) {
                String normalized = profile.trim().toLowerCase();
                if ("prod".equals(normalized) || "production".equals(normalized)) {
                    return true;
                }
            }
        }
        return false;
    }

    public long getJwtExpirationInMs() {
        return jwtExpirationInMs;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("userId", userPrincipal.getId().toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }
}
