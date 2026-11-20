package io.kubemind.backend.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KubernetesClientConfigTest {

    @Test
    @DisplayName("Production profile: Should fail fast when in-cluster ServiceAccount is missing")
    void testProductionFailsWhenInClusterUnavailable() {
        KubernetesClientConfig config = new KubernetesClientConfig();
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("prod");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            config.kubernetesApiClient(env);
        });

        assertTrue(ex.getMessage().contains("Production Kubernetes client initialization failed"));
    }

    @Test
    @DisplayName("Local dev profile: Fallback client is created when cluster is unreachable")
    void testDevProfileProvidesFallbackClient() {
        KubernetesClientConfig config = new KubernetesClientConfig();
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        var client = config.kubernetesApiClient(env);
        org.junit.jupiter.api.Assertions.assertNotNull(client);
    }
}
