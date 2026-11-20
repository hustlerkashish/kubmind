package io.kubemind.backend.config;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.util.ClientBuilder;
import io.kubernetes.client.util.KubeConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.io.FileReader;
import java.io.File;

@Configuration
@Slf4j
public class KubernetesClientConfig {

    private boolean isProduction(Environment environment) {
        if (environment == null) return false;
        for (String profile : environment.getActiveProfiles()) {
            if (profile != null) {
                String p = profile.trim().toLowerCase();
                if ("prod".equals(p) || "production".equals(p)) return true;
            }
        }
        return false;
    }

    @Bean
    public ApiClient kubernetesApiClient(Environment environment) {
        log.info("Initializing Official Kubernetes Java Client Configuration...");

        boolean prod = isProduction(environment);

        if (prod) {
            // Production MUST use native In-Cluster ServiceAccount authentication
            log.info("Production profile active: Initializing native in-cluster Kubernetes ServiceAccount client...");
            try {
                ApiClient inClusterClient = ClientBuilder.cluster().build();
                io.kubernetes.client.openapi.Configuration.setDefaultApiClient(inClusterClient);
                log.info("In-cluster Kubernetes ServiceAccount client initialized successfully.");
                return inClusterClient;
            } catch (Exception ex) {
                log.error("CRITICAL: Failed to initialize in-cluster Kubernetes ServiceAccount client: {}", ex.getMessage());
                throw new IllegalStateException("Production Kubernetes client initialization failed: In-cluster ServiceAccount credentials not found or invalid: " + ex.getMessage(), ex);
            }
        }

        // Local / Development Mode:
        // Priority 1: Explicit KUBERNETES_API_URL and KUBERNETES_SERVICE_ACCOUNT_TOKEN
        String apiUrl = System.getenv("KUBERNETES_API_URL");
        String token = System.getenv("KUBERNETES_SERVICE_ACCOUNT_TOKEN");
        if (token == null || token.isBlank()) {
            token = System.getenv("KUBERNETES_TOKEN");
        }

        if (apiUrl != null && !apiUrl.isBlank()) {
            log.info("Local development: Configuring Kubernetes client from explicit KUBERNETES_API_URL: {}", apiUrl);
            try {
                ApiClient client = new ApiClient();
                client.setBasePath(apiUrl.replaceAll("/+$", ""));
                if (token != null && !token.isBlank()) {
                    client.setApiKeyPrefix("Bearer");
                    client.setApiKey(token);
                }
                boolean verifySsl = Boolean.parseBoolean(System.getenv().getOrDefault("KUBERNETES_VERIFY_SSL", "false"));
                client.setVerifyingSsl(verifySsl);
                io.kubernetes.client.openapi.Configuration.setDefaultApiClient(client);
                return client;
            } catch (Exception ex) {
                log.warn("Failed to configure client from KUBERNETES_API_URL: {}", ex.getMessage());
            }
        }

        // Priority 2: Dedicated explicit KUBECONFIG file (if explicitly set and exists)
        String kubeconfigPath = System.getenv("KUBECONFIG");
        if (kubeconfigPath != null && !kubeconfigPath.isBlank()) {
            File kubeconfigFile = new File(kubeconfigPath);
            if (kubeconfigFile.exists()) {
                log.info("Local development: Loading dedicated KubeConfig file: {}", kubeconfigFile.getAbsolutePath());
                try {
                    KubeConfig kubeConfig = KubeConfig.loadKubeConfig(new FileReader(kubeconfigFile));
                    ApiClient client = ClientBuilder.kubeconfig(kubeConfig).build();
                    io.kubernetes.client.openapi.Configuration.setDefaultApiClient(client);
                    return client;
                } catch (Exception ex) {
                    log.warn("Failed to load KubeConfig from {}: {}", kubeconfigFile.getAbsolutePath(), ex.getMessage());
                }
            }
        }

        // Priority 3: Standard ClientBuilder fallback (e.g. host-running backend during dev)
        try {
            log.info("Local development: Attempting standard ClientBuilder discovery...");
            ApiClient standardClient = ClientBuilder.standard().build();
            io.kubernetes.client.openapi.Configuration.setDefaultApiClient(standardClient);
            return standardClient;
        } catch (Exception ex) {
            log.warn("Local development: Standard Kubernetes client discovery unavailable ({}), using offline fallback client.", ex.getMessage());
            ApiClient fallbackClient = new ApiClient();
            fallbackClient.setBasePath("http://localhost:8080");
            return fallbackClient;
        }
    }
}
