package io.kubemind.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class SsrfValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "http://169.254.169.254/latest/meta-data/",
            "https://169.254.169.254/secret",
            "http://0xa9fea9fe/latest/meta-data/", // Hex IP representation of 169.254.169.254
            "http://2852039166/latest/meta-data/", // Decimal integer representation of 169.254.169.254
            "http://[::ffff:169.254.169.254]/meta-data", // IPv4-mapped IPv6
            "http://metadata.google.internal/computeMetadata/v1/",
            "http://metadata.google/",
            "http://100.100.100.200/latest/meta-data/",
            "http://postgres:5432/",
            "http://kubemind-db:5432/",
            "file:///etc/passwd",
            "gopher://127.0.0.1:6379",
            "ftp://anonymous@example.com/dump",
            "ldap://attacker.com/exploit",
            "",
            "   "
    })
    @DisplayName("SSRF Validator blocks dangerous metadata, cloud internal hosts, alternative IP encodings, and invalid schemes")
    void isSafeUrl_DangerousTargets_ReturnsFalse(String dangerousUrl) {
        assertThat(SsrfValidator.isSafeUrl(dangerousUrl)).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "http://prometheus:9090",
            "https://kubernetes.default.svc.cluster.local:443",
            "http://host.docker.internal:8080",
            "https://k8s-cluster.company.internal:6443/api"
    })
    @DisplayName("SSRF Validator permits safe HTTP/HTTPS infrastructure targets")
    void isSafeUrl_SafeTargets_ReturnsTrue(String safeUrl) {
        assertThat(SsrfValidator.isSafeUrl(safeUrl)).isTrue();
    }
}
