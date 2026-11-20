package io.kubemind.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    private static final String STRONG_VALID_SECRET =
            "c7d9e1f3a5b7c9e1f3a5b7c9e1f3a5b7c7d9e1f3a5b7c9e1f3a5b7c9e1f3a5b7"; // 64 hex chars = 256 bits

    private static final String COMPROMISED_SECRET_1 =
            "404e635266556a586e3272357538782f413f4428472b4b6250645367566b5970";

    private static final String COMPROMISED_SECRET_2 =
            "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b";

    @Test
    @DisplayName("Scenario 1: Missing JWT secret fails startup with IllegalStateException")
    void validateJwtConfiguration_MissingSecret_ThrowsException() {
        MockEnvironment env = new MockEnvironment();
        JwtTokenProvider provider = new JwtTokenProvider(env);
        ReflectionTestUtils.setField(provider, "jwtSecret", "");

        assertThatThrownBy(provider::validateJwtConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Mandatory JWT signing secret");

        ReflectionTestUtils.setField(provider, "jwtSecret", null);
        assertThatThrownBy(provider::validateJwtConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Mandatory JWT signing secret");
    }

    @Test
    @DisplayName("Scenario 2: Weak JWT secret (less than 256 bits) fails startup with IllegalStateException")
    void validateJwtConfiguration_WeakSecret_ThrowsException() {
        MockEnvironment env = new MockEnvironment();
        JwtTokenProvider provider = new JwtTokenProvider(env);
        ReflectionTestUtils.setField(provider, "jwtSecret", "too-short-weak-secret-123"); // 25 bytes < 32 bytes

        assertThatThrownBy(provider::validateJwtConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Insecure JWT secret: Key length is");
    }

    @Test
    @DisplayName("Scenario 3: Valid cryptographically strong secret initializes cleanly and issues/validates tokens")
    void validateJwtConfiguration_ValidSecret_InitializesSuccessfully() {
        MockEnvironment env = new MockEnvironment();
        JwtTokenProvider provider = new JwtTokenProvider(env);
        ReflectionTestUtils.setField(provider, "jwtSecret", STRONG_VALID_SECRET);
        ReflectionTestUtils.setField(provider, "jwtExpirationInMs", 86400000L);

        provider.validateJwtConfiguration();

        UserPrincipal principal = new UserPrincipal(
                UUID.randomUUID(),
                "operator",
                "operator@kubemind.io",
                "encoded_pwd",
                Collections.emptyList()
        );
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        String token = provider.generateToken(auth);
        assertThat(token).isNotBlank();
        assertThat(provider.validateToken(token)).isTrue();
        assertThat(provider.getUsernameFromJWT(token)).isEqualTo("operator");
    }

    @ParameterizedTest
    @ValueSource(strings = {"prod", "production", "PROD", "Production", "  prod  "})
    @DisplayName("Scenario 4a: Production profile detection identifies prod and production case-insensitively")
    void validateJwtConfiguration_ProductionProfileDetection_IdentifiesProdAndProduction(String profile) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles(profile);
        JwtTokenProvider provider = new JwtTokenProvider(env);

        assertThat(provider.isProductionEnvironment()).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"dev", "development", "test", "staging", "default"})
    @DisplayName("Scenario 4b: Non-production profiles are correctly identified as non-production")
    void validateJwtConfiguration_ProductionProfileDetection_IdentifiesNonProduction(String profile) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles(profile);
        JwtTokenProvider provider = new JwtTokenProvider(env);

        assertThat(provider.isProductionEnvironment()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            COMPROMISED_SECRET_1,
            "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970", // uppercase
            COMPROMISED_SECRET_2,
            "9A8B7C6D5E4F3A2B1C0D9E8F7A6B5C4D3E2F1A0B9C8D7E6F5A4B3C2D1E0F9A8B"  // uppercase
    })
    @DisplayName("Scenario 5: Known compromised repository secret in production throws IllegalStateException")
    void validateJwtConfiguration_CompromisedSecretInProduction_ThrowsException(String compromisedSecret) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("JWT_EXPIRATION_MS", "3600000");

        JwtTokenProvider provider = new JwtTokenProvider(env);
        ReflectionTestUtils.setField(provider, "jwtSecret", compromisedSecret);

        assertThatThrownBy(provider::validateJwtConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Known compromised repository default secret detected in JWT_SECRET");
    }

    @ParameterizedTest
    @ValueSource(strings = {COMPROMISED_SECRET_1, COMPROMISED_SECRET_2})
    @DisplayName("Scenario 6: Compromised secret in development is accepted if key length is >= 256 bits")
    void validateJwtConfiguration_CompromisedSecretInDevelopment_AcceptedIfKeyLengthValid(String secret) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        JwtTokenProvider provider = new JwtTokenProvider(env);
        ReflectionTestUtils.setField(provider, "jwtSecret", secret);
        ReflectionTestUtils.setField(provider, "jwtExpirationInMs", 86400000L);

        // Does not throw in development
        provider.validateJwtConfiguration();
        assertThat(provider.getJwtExpirationInMs()).isEqualTo(86400000L);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "0", "-1000", "-1"})
    @DisplayName("Scenario 7a: Missing, empty, zero, or negative expiration in production throws IllegalStateException")
    void validateJwtConfiguration_MissingZeroNegativeExpirationInProduction_ThrowsException(String invalidExpiration) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("production");
        if (!invalidExpiration.isEmpty()) {
            env.setProperty("JWT_EXPIRATION_MS", invalidExpiration);
        }

        JwtTokenProvider provider = new JwtTokenProvider(env);
        ReflectionTestUtils.setField(provider, "jwtSecret", STRONG_VALID_SECRET);

        assertThatThrownBy(provider::validateJwtConfiguration)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_EXPIRATION_MS");
    }

    @Test
    @DisplayName("Scenario 7b: Valid positive expiration in production is correctly applied")
    void validateJwtConfiguration_ValidExpirationInProduction_Succeeds() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");
        env.setProperty("JWT_EXPIRATION_MS", "7200000");

        JwtTokenProvider provider = new JwtTokenProvider(env);
        ReflectionTestUtils.setField(provider, "jwtSecret", STRONG_VALID_SECRET);

        provider.validateJwtConfiguration();
        assertThat(provider.getJwtExpirationInMs()).isEqualTo(7200000L);
    }

    @Test
    @DisplayName("Scenario 8: Default expiration in development retains 24 hours (86,400,000 ms)")
    void validateJwtConfiguration_DefaultExpirationInDevelopment_Retains24Hours() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        JwtTokenProvider provider = new JwtTokenProvider(env);
        ReflectionTestUtils.setField(provider, "jwtSecret", STRONG_VALID_SECRET);

        provider.validateJwtConfiguration();
        assertThat(provider.getJwtExpirationInMs()).isEqualTo(86400000L);
    }
}
